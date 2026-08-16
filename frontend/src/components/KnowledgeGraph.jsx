import React, { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  addEdge,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    data: { label: '👤 Rahul' },
    position: { x: 300, y: 20 },
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      padding: '14px 28px',
      borderRadius: '16px',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
      width: '160px',
      textAlign: 'center'
    }
  },
  {
    id: '2',
    data: { label: '☁️ AWS' },
    position: { x: 100, y: 200 },
    style: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#fff',
      padding: '14px 28px',
      borderRadius: '16px',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      boxShadow: '0 8px 32px rgba(245, 87, 108, 0.4)',
      width: '160px',
      textAlign: 'center'
    }
  },
  {
    id: '3',
    data: { label: '☁️ GCP' },
    position: { x: 450, y: 200 },
    style: {
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#fff',
      padding: '14px 28px',
      borderRadius: '16px',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      boxShadow: '0 8px 32px rgba(79, 172, 254, 0.4)',
      width: '160px',
      textAlign: 'center'
    }
  },
  {
    id: '4',
    data: { label: '👤 Priya' },
    position: { x: 600, y: 50 },
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      padding: '14px 28px',
      borderRadius: '16px',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
      width: '160px',
      textAlign: 'center'
    }
  },
  {
    id: '5',
    data: { label: '📋 CLOUD-102' },
    position: { x: 200, y: 380 },
    style: {
      background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      color: '#333',
      padding: '14px 28px',
      borderRadius: '16px',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      boxShadow: '0 8px 32px rgba(253, 160, 133, 0.4)',
      width: '160px',
      textAlign: 'center'
    }
  },
  {
    id: '6',
    data: { label: '💡 GCP Migration' },
    position: { x: 450, y: 380 },
    style: {
      background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      color: '#333',
      padding: '14px 28px',
      borderRadius: '16px',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      boxShadow: '0 8px 32px rgba(161, 140, 209, 0.4)',
      width: '160px',
      textAlign: 'center'
    }
  },
  {
    id: '7',
    data: { label: '👤 Amit' },
    position: { x: 600, y: 300 },
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      padding: '14px 28px',
      borderRadius: '16px',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
      width: '160px',
      textAlign: 'center'
    }
  }
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    label: 'REPORTED ISSUE',
    animated: true,
    labelBgStyle: { fill: 'rgba(10,14,23,0.9)', rx: 8, ry: 8 },
    labelStyle: { fill: '#f5576c', fontSize: 11, fontWeight: '700' },
    style: { stroke: '#f5576c', strokeWidth: 3, strokeDasharray: '6,4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f5576c', width: 20, height: 20 }
  },
  {
    id: 'e4-3',
    source: '4',
    target: '3',
    label: 'PROPOSED',
    animated: true,
    labelBgStyle: { fill: 'rgba(10,14,23,0.9)', rx: 8, ry: 8 },
    labelStyle: { fill: '#4facfe', fontSize: 11, fontWeight: '700' },
    style: { stroke: '#4facfe', strokeWidth: 3, strokeDasharray: '6,4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4facfe', width: 20, height: 20 }
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    label: 'CREATED',
    animated: true,
    labelBgStyle: { fill: 'rgba(10,14,23,0.9)', rx: 8, ry: 8 },
    labelStyle: { fill: '#fda085', fontSize: 11, fontWeight: '700' },
    style: { stroke: '#fda085', strokeWidth: 3, strokeDasharray: '6,4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#fda085', width: 20, height: 20 }
  },
  {
    id: 'e5-6',
    source: '5',
    target: '6',
    label: 'TRACKS',
    animated: true,
    labelBgStyle: { fill: 'rgba(10,14,23,0.9)', rx: 8, ry: 8 },
    labelStyle: { fill: '#a18cd1', fontSize: 11, fontWeight: '700' },
    style: { stroke: '#a18cd1', strokeWidth: 3, strokeDasharray: '6,4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#a18cd1', width: 20, height: 20 }
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    label: 'IMPLEMENTED',
    animated: true,
    labelBgStyle: { fill: 'rgba(10,14,23,0.9)', rx: 8, ry: 8 },
    labelStyle: { fill: '#00f2fe', fontSize: 11, fontWeight: '700' },
    style: { stroke: '#00f2fe', strokeWidth: 3, strokeDasharray: '6,4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00f2fe', width: 20, height: 20 }
  },
  {
    id: 'e7-3',
    source: '7',
    target: '3',
    label: 'DEPLOYED',
    animated: true,
    labelBgStyle: { fill: 'rgba(10,14,23,0.9)', rx: 8, ry: 8 },
    labelStyle: { fill: '#764ba2', fontSize: 11, fontWeight: '700' },
    style: { stroke: '#764ba2', strokeWidth: 3, strokeDasharray: '6,4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#764ba2', width: 20, height: 20 }
  },
  {
    id: 'e3-2',
    source: '3',
    target: '2',
    label: 'REPLACES',
    animated: true,
    labelBgStyle: { fill: 'rgba(10,14,23,0.9)', rx: 8, ry: 8 },
    labelStyle: { fill: '#f093fb', fontSize: 11, fontWeight: '700' },
    style: { stroke: '#f093fb', strokeWidth: 3, strokeDasharray: '6,4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f093fb', width: 20, height: 20 }
  }
];

const KnowledgeGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodeCount, setNodeCount] = useState(initialNodes.length);
  const [edgeCount, setEdgeCount] = useState(initialEdges.length);

  useEffect(() => {
    setNodeCount(nodes.length);
    setEdgeCount(edges.length);
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      type: ConnectionLineType.SmoothStep,
      style: { stroke: '#667eea', strokeWidth: 3 },
      labelStyle: { fill: '#667eea', fontSize: 11, fontWeight: '700' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#667eea' }
    }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div style={{ 
      height: '650px', 
      background: 'linear-gradient(180deg, #0a0e17 0%, #141b2b 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    }}>
      
      {/* Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(102,126,234,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Stats Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(10,14,23,0.85)',
        backdropFilter: 'blur(20px)',
        padding: '16px 24px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>✨</span>
          <div>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
              Knowledge Graph
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <span style={{ color: '#6c8ba0', fontSize: '12px' }}>
                <span style={{ color: '#667eea', fontWeight: '700' }}>{nodeCount}</span> Nodes
              </span>
              <span style={{ color: '#6c8ba0', fontSize: '12px' }}>
                <span style={{ color: '#4facfe', fontWeight: '700' }}>{edgeCount}</span> Relationships
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button 
          onClick={() => reactFlowInstance?.fitView({ padding: 0.2 })}
          style={{
            background: 'rgba(10,14,23,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#e0e0e0',
            padding: '10px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            width: '120px',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(102,126,234,0.2)';
            e.target.style.borderColor = '#667eea';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(10,14,23,0.85)';
            e.target.style.borderColor = 'rgba(255,255,255,0.06)';
          }}
        >
          🔍 Fit View
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => reactFlowInstance?.zoomIn()}
            style={{
              background: 'rgba(10,14,23,0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#e0e0e0',
              padding: '10px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              width: '56px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(102,126,234,0.2)';
              e.target.style.borderColor = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(10,14,23,0.85)';
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            +
          </button>
          <button 
            onClick={() => reactFlowInstance?.zoomOut()}
            style={{
              background: 'rgba(10,14,23,0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#e0e0e0',
              padding: '10px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              width: '56px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(102,126,234,0.2)';
              e.target.style.borderColor = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(10,14,23,0.85)';
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            −
          </button>
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          background: 'rgba(10,14,23,0.92)',
          backdropFilter: 'blur(20px)',
          padding: '20px 24px',
          borderRadius: '16px',
          border: '1px solid rgba(102,126,234,0.3)',
          zIndex: 10,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          maxWidth: '280px',
          animation: 'slideUp 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>{selectedNode.data.label.split(' ')[0]}</span>
            <div>
              <div style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>
                {selectedNode.data.label}
              </div>
              <div style={{ color: '#6c8ba0', fontSize: '12px' }}>
                {selectedNode.type || 'Entity'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setSelectedNode(null)}
            style={{
              marginTop: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#6c8ba0',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(102,126,234,0.2)';
              e.target.style.borderColor = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.05)';
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '30px',
        background: 'rgba(10,14,23,0.85)',
        backdropFilter: 'blur(20px)',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ color: '#6c8ba0', fontSize: '11px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>💡 Click node to inspect</span>
          <span>🔄 Drag to pan</span>
          <span>🔍 Scroll to zoom</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={setReactFlowInstance}
        fitView
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#667eea', strokeWidth: 3 },
          labelStyle: { fill: '#667eea', fontSize: 11, fontWeight: '700' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#667eea' }
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1.5} 
          color="rgba(255,255,255,0.04)" 
        />
        <Controls 
          style={{
            background: 'rgba(10,14,23,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
          showInteractive={false}
        />
        <MiniMap 
          style={{
            background: 'rgba(10,14,23,0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
          maskColor="rgba(0,0,0,0.4)"
          nodeStrokeWidth={2}
          nodeBorderRadius={8}
        />
      </ReactFlow>

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .react-flow__node {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            cursor: pointer !important;
            z-index: 5 !important;
          }
          
          .react-flow__node:hover {
            transform: scale(1.08) !important;
            filter: brightness(1.2) !important;
            z-index: 20 !important;
          }
          
          .react-flow__node:active {
            transform: scale(0.95) !important;
          }
          
          .react-flow__edge {
            cursor: pointer !important;
          }
          
          .react-flow__edge:hover .react-flow__edge-path {
            stroke-width: 5px !important;
            filter: drop-shadow(0 0 12px rgba(102,126,234,0.4)) !important;
          }
          
          .react-flow__edge-label {
            background: rgba(10,14,23,0.9) !important;
            padding: 4px 12px !important;
            border-radius: 8px !important;
            font-weight: 700 !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255,255,255,0.05) !important;
          }
          
          .react-flow__edge-animated .react-flow__edge-path {
            stroke-dasharray: 8, 4 !important;
          }
          
          .react-flow__controls button {
            border-radius: 8px !important;
            transition: all 0.3s ease !important;
          }
          
          .react-flow__controls button:hover {
            background: rgba(102,126,234,0.2) !important;
          }
          
          .react-flow__minimap {
            border-radius: 12px !important;
          }
          
          .react-flow__minimap .react-flow__minimap-node {
            border-radius: 6px !important;
          }
        `}
      </style>
    </div>
  );
};

export default KnowledgeGraph;