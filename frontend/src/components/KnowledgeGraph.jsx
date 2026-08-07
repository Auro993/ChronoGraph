import React, { useCallback, useState } from 'react';
import ReactFlow, {
  addEdge,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Rahul' },
    position: { x: 250, y: 0 },
    style: { background: '#6c63ff', color: 'white', padding: '10px 20px', borderRadius: '8px' }
  },
  {
    id: '2',
    data: { label: 'AWS' },
    position: { x: 100, y: 100 },
    style: { background: '#ff6b6b', color: 'white', padding: '10px 20px', borderRadius: '8px' }
  },
  {
    id: '3',
    data: { label: 'GCP' },
    position: { x: 400, y: 100 },
    style: { background: '#4facfe', color: 'white', padding: '10px 20px', borderRadius: '8px' }
  },
  {
    id: '4',
    data: { label: 'Priya' },
    position: { x: 400, y: 200 },
    style: { background: '#6c63ff', color: 'white', padding: '10px 20px', borderRadius: '8px' }
  },
  {
    id: '5',
    data: { label: 'CLOUD-102' },
    position: { x: 250, y: 200 },
    style: { background: '#feca57', color: '#333', padding: '10px 20px', borderRadius: '8px' }
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', label: 'reported cost issue', animated: true },
  { id: 'e1-3', source: '1', target: '3', label: 'proposed migration', animated: true },
  { id: 'e3-2', source: '3', target: '2', label: 'replaces', animated: true },
  { id: 'e4-3', source: '4', target: '3', label: 'evaluates', animated: true },
  { id: 'e5-3', source: '5', target: '3', label: 'tracks', animated: true },
];

const KnowledgeGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, type: ConnectionLineType.SmoothStep }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    console.log('Node clicked:', node);
  }, []);

  return (
    <div style={{ height: '600px', background: '#0a0e17' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Panel position="top-right" style={{ background: '#121926', padding: '10px 15px', borderRadius: '8px', border: '1px solid #1a2a3a' }}>
          <div style={{ color: '#e0e0e0', fontSize: '14px' }}>
            <strong>Knowledge Graph</strong>
            <div style={{ fontSize: '12px', color: '#6c8ba0' }}>
              {nodes.length} nodes • {edges.length} relationships
            </div>
          </div>
        </Panel>
        
        {selectedNode && (
          <Panel position="bottom-right" style={{ background: '#121926', padding: '15px', borderRadius: '8px', border: '1px solid #1a2a3a', maxWidth: '300px' }}>
            <div style={{ color: '#e0e0e0' }}>
              <strong>{selectedNode.data.label}</strong>
              <div style={{ fontSize: '12px', color: '#6c8ba0' }}>
                Type: {selectedNode.style?.background === '#6c63ff' ? 'Person' : 
                       selectedNode.style?.background === '#ff6b6b' ? 'Technology' :
                       selectedNode.style?.background === '#4facfe' ? 'Technology' : 'Project'}
              </div>
              <div style={{ fontSize: '12px', color: '#6c8ba0', marginTop: '5px' }}>
                Click node to inspect
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default KnowledgeGraph;