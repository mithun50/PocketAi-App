package com.nxg.pocketai.userdata

import android.content.Context
import com.nxg.pocketai.userdata.helpers.MemoryDataTags
import com.nxg.pocketai.userdata.helpers.createNewMemory
import com.nxg.pocketai.userdata.ntds.getBrainFilePath
import com.nxg.pocketai.userdata.ntds.getOrCreateHardwareBackedAesKey
import com.nxg.pocketai.userdata.ntds.loadEncryptedTree
import com.nxg.pocketai.userdata.ntds.neuron_tree.NeuronNode
import com.nxg.pocketai.userdata.ntds.neuron_tree.NeuronTree
import com.nxg.pocketai.userdata.ntds.neuron_tree.NodeData
import com.nxg.pocketai.userdata.ntds.neuron_tree.NodeType
import com.nxg.pocketai.userdata.ntds.saveEncryptedTree
import org.json.JSONArray
import org.json.JSONObject
import javax.crypto.SecretKey

fun getDefaultBrainStructure(): NeuronTree {
    val root = NeuronNode("root", NodeData("", NodeType.ROOT))
    val tree = NeuronTree(root)

    // Core nodes
    val chatHistory = NeuronNode("chatHistory", NodeData("", NodeType.OPERATOR))
    val memoryHistory = NeuronNode("memoryHistory", NodeData("", NodeType.OPERATOR))
    val modelState = NeuronNode("modelSate", NodeData("", NodeType.OPERATOR))
    val systemLogs = NeuronNode(
        id = "systemLogs",
        data = NodeData(
            content = JSONObject().apply {
                put("title", "System Logs")
                put("sessions", JSONArray())
            }.toString(),
            type = NodeType.OPERATOR
        )
    )

    val savedTTS = NeuronNode(
        id = "savedTTS",
        data = NodeData(
            content = "",
            type = NodeType.OPERATOR
        )
    )

    tree.addChild(root.id, chatHistory, memoryHistory, modelState, systemLogs, savedTTS)

    // Memory categories
    createNewMemory(root, MemoryDataTags.Family, JSONObject())
    createNewMemory(root, MemoryDataTags.Friends, JSONObject())
    createNewMemory(root, MemoryDataTags.Work, JSONObject())
    createNewMemory(root, MemoryDataTags.Health, JSONObject())
    createNewMemory(root, MemoryDataTags.Education, JSONObject())
    createNewMemory(root, MemoryDataTags.Entertainment, JSONObject())
    createNewMemory(root, MemoryDataTags.Other, JSONObject())

    return tree
}

fun migrateBrainStructure(root: NeuronNode) {
    val tree = NeuronTree(root)

    // Ensure operators exist
    tree.getNodeDirectOrNull("chatHistory")
        ?: NeuronNode("chatHistory", NodeData("", NodeType.OPERATOR)).also {
            tree.addChild(root.id, it)
        }

    tree.getNodeDirectOrNull("memoryHistory")
        ?: NeuronNode("memoryHistory", NodeData("", NodeType.OPERATOR)).also {
            tree.addChild(root.id, it)
        }

    // Ensure system logs node exists
    tree.getNodeDirectOrNull("systemLogs")
        ?: NeuronNode(
            id = "systemLogs",
            data = NodeData(
                content = JSONObject().apply {
                    put("title", "System Logs")
                    put("sessions", JSONArray())
                }.toString(),
                type = NodeType.OPERATOR
            )
        ).also {
            tree.addChild(root.id, it)
        }

    // Ensure memory categories
    for (tag in MemoryDataTags.entries) {
        val nodeId = tag.toString().lowercase()
        if (tree.getNodeDirectOrNull(nodeId) == null) {
            createNewMemory(root, tag, JSONObject("""{"messages": []}"""))
        }
    }
}

fun readBrainFile(key: SecretKey, context: Context): NeuronTree {
    val brainFile = getBrainFilePath(context)
    val tree = loadEncryptedTree(brainFile, key) ?: getDefaultBrainStructure()

    // Always run migration
    migrateBrainStructure(tree.root)

    return tree
}

fun getDefaultChatHistory(root: NeuronNode): NeuronNode {
    return NeuronTree(root).getNodeDirect("chatHistory")
}

fun getDefaultMemoryHistory(root: NeuronNode): NeuronNode {
    return NeuronTree(root).getNodeDirect("memoryHistory")
}

fun addNewChat(root: NeuronNode, data: JSONObject): NeuronNode {
    val chatHistory = getDefaultChatHistory(root)
    val newChat = NeuronNode(data = NodeData(data.toString(), NodeType.LEAF))
    NeuronTree(root).addChild(chatHistory.id, newChat)
    return newChat
}

fun saveTree(tree: NeuronTree, context: Context, alise: String) {
    val key = getOrCreateHardwareBackedAesKey(alise)
    val file = getBrainFilePath(context)
    saveEncryptedTree(tree, file, key)
}