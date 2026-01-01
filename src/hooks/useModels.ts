import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import { connectionManager } from '../services/connection';
import { Model, InstalledModel, DownloadState } from '../types';

export function useModels() {
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [downloadState, setDownloadState] = useState<DownloadState>({
    modelName: null,
    status: 'idle',
    progress: 0,
  });

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const [availableResult, installedResult] = await Promise.all([
        api.getModels(),
        api.getInstalledModels(),
      ]);

      if (availableResult.success && availableResult.data) {
        setAvailableModels(availableResult.data.models);
      } else {
        setError(availableResult.error);
      }

      if (installedResult.success && installedResult.data) {
        setInstalledModels(installedResult.data.models);
      }
    } catch (err) {
      setError('Failed to fetch models');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const installModel = useCallback(async (modelName: string) => {
    setDownloadState({
      modelName,
      status: 'downloading',
      progress: 0,
    });

    // Pause health check polling during model installation (server is busy)
    connectionManager.pause();

    // Simulate progress with exponential slowdown for more realistic UX
    // Progress slows down as it approaches 90% to avoid jarring jump to 100%
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      setDownloadState((prev) => {
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        // Use logarithmic curve: fast at start, slows down approaching 90%
        // This creates more realistic download progress feel
        const targetProgress = Math.min(90 * (1 - Math.exp(-elapsed / 30)), 90);
        // Add small random variation for realism
        const jitter = Math.random() * 2 - 1;
        const newProgress = Math.min(Math.max(prev.progress, targetProgress + jitter), 90);
        return {
          ...prev,
          progress: newProgress,
        };
      });
    }, 800);

    try {
      const result = await api.installModel(modelName);

      clearInterval(progressInterval);

      if (result.success) {
        setDownloadState({
          modelName,
          status: 'complete',
          progress: 100,
        });
        // Refresh models list
        await fetchModels();
      } else {
        setDownloadState({
          modelName,
          status: 'error',
          progress: 0,
          error: result.error,
        });
      }

      // Reset after delay
      setTimeout(() => {
        setDownloadState({
          modelName: null,
          status: 'idle',
          progress: 0,
        });
      }, 2000);

      return result;
    } finally {
      // Resume health check polling
      connectionManager.resume();
    }
  }, [fetchModels]);

  const removeModel = useCallback(async (modelName: string) => {
    connectionManager.pause();
    try {
      const result = await api.removeModel(modelName);
      if (result.success) {
        await fetchModels();
      }
      return result;
    } finally {
      connectionManager.resume();
    }
  }, [fetchModels]);

  const activateModel = useCallback(async (modelName: string) => {
    connectionManager.pause();
    try {
      const result = await api.activateModel(modelName);
      if (result.success) {
        await fetchModels();
      }
      return result;
    } finally {
      connectionManager.resume();
    }
  }, [fetchModels]);

  return {
    availableModels,
    installedModels,
    loading,
    error,
    downloadState,
    refresh: fetchModels,
    installModel,
    removeModel,
    activateModel,
  };
}
