package com.nxg.pocketai.model

import com.nxg.pocketai.userdata.ntds.neuron_tree.NodeType

enum class ViewMode {
    TREE, LIST, STATS
}

data class NodeStats(
    val total: Int,
    val byType: Map<NodeType, Int>,
    val totalContent: Int,
    val deepestLevel: Int
)