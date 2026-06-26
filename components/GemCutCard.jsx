import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Polygon, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../context/GlobalContext';

export default function GemCutCard({ 
  children, 
  style, 
  borderColor, 
  chamfer = 18, // Symmetrical octagonal corners default
  inset = 10,    // Facet bevel width default
  contentStyle
}) {
  const { theme } = useTheme();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [pointer, setPointer] = useState({ dx: 0, dy: 0 });

  const onLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  const handlePointerMove = (e) => {
    const { width, height } = dimensions;
    if (width > 0 && height > 0) {
      const x = e.nativeEvent.offsetX ?? e.nativeEvent.locationX;
      const y = e.nativeEvent.offsetY ?? e.nativeEvent.locationY;
      
      const dx = Math.max(-0.5, Math.min(0.5, (x / width) - 0.5));
      const dy = Math.max(-0.5, Math.min(0.5, (y / height) - 0.5));
      
      setPointer({ dx, dy });
    }
  };

  const handlePointerLeave = () => {
    setPointer({ dx: 0, dy: 0 });
  };

  const w = dimensions.width;
  const h = dimensions.height;

  // Calculate dynamic chamfer and inset relative to card dimensions to fit elegantly
  const activeChamfer = w > 0 && h > 0 ? Math.min(chamfer, Math.min(w, h) * 0.12) : chamfer;
  const activeInset = w > 0 && h > 0 ? Math.min(inset, Math.min(w, h) * 0.08) : inset;

  // Vertex coordinates for outer and inner octagons using activeChamfer/activeInset
  const P1 = { x: activeChamfer, y: 0 };
  const P2 = { x: w - activeChamfer, y: 0 };
  const P3 = { x: w, y: activeChamfer };
  const P4 = { x: w, y: h - activeChamfer };
  const P5 = { x: w - activeChamfer, y: h };
  const P6 = { x: activeChamfer, y: h };
  const P7 = { x: 0, y: h - activeChamfer };
  const P8 = { x: 0, y: activeChamfer };

  const Q1 = { x: activeChamfer + activeInset, y: activeInset };
  const Q2 = { x: w - activeChamfer - activeInset, y: activeInset };
  const Q3 = { x: w - activeInset, y: activeChamfer + activeInset };
  const Q4 = { x: w - activeInset, y: h - activeChamfer - activeInset };
  const Q5 = { x: w - activeChamfer - activeInset, y: h - activeInset };
  const Q6 = { x: activeChamfer + activeInset, y: h - activeInset };
  const Q7 = { x: activeInset, y: h - activeChamfer - activeInset };
  const Q8 = { x: activeInset, y: activeChamfer + activeInset };

  const pts = (...pList) => pList.map(p => `${p.x},${p.y}`).join(' ');

  const outerOctagonPts = w > 0 && h > 0 ? pts(P1, P2, P3, P4, P5, P6, P7, P8) : '';
  const innerOctagonPts = w > 0 && h > 0 ? pts(Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8) : '';

  // VERY SUBTLE & LOW CONTRAST Facet Opacities (Primary Light Source: TOP-RIGHT)
  const topHighlightOpacity = Math.max(0.10, Math.min(0.30, 0.20 - pointer.dy * 0.18));
  const rightHighlightOpacity = Math.max(0.10, Math.min(0.30, 0.20 + pointer.dx * 0.18));
  const topRightHighlightOpacity = Math.max(0.12, Math.min(0.35, 0.24 + (pointer.dx - pointer.dy) * 0.18));
  
  const leftShadowOpacity = Math.max(0.04, Math.min(0.18, 0.09 - pointer.dx * 0.1));
  const bottomShadowOpacity = Math.max(0.04, Math.min(0.18, 0.09 + pointer.dy * 0.1));
  const bottomLeftShadowOpacity = Math.max(0.05, Math.min(0.20, 0.11 - (pointer.dx - pointer.dy) * 0.12));

  // Transitional facets
  const topLeftShadeOpacity = Math.max(0.04, Math.min(0.16, 0.09 - (pointer.dx + pointer.dy) * 0.08));
  const bottomRightShadeOpacity = Math.max(0.04, Math.min(0.16, 0.09 + (pointer.dx + pointer.dy) * 0.08));

  // Specular highlight opacity (very delicate shimmer)
  const specularOpacity = Math.max(0.15, Math.min(0.45, 0.28 + (pointer.dx - pointer.dy) * 0.2));

  const currentBorderColor = borderColor || theme.primary + '80'; 
  
  // Slightly higher opacity lines so the facet cuts are clearly distinguishable
  const innerLineColor = theme.isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)';

  // Uniform center table fill color
  const tableFillColor = theme.isDark ? 'rgba(26, 26, 26, 0.92)' : 'rgba(255, 255, 255, 0.92)';

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const isFlex = flattenedStyle.flex !== undefined;

  const webPointerEvents = Platform.OS === 'web' ? {
    onMouseMove: handlePointerMove,
    onMouseLeave: handlePointerLeave,
  } : {};

  return (
    <View 
      onLayout={onLayout} 
      {...webPointerEvents}
      style={[styles.baseContainer, style, { backgroundColor: 'transparent' }]}
    >
      {w > 0 && h > 0 && (
        <Svg 
          style={StyleSheet.absoluteFill} 
          width={w} 
          height={h}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id="backingSubtleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop 
                offset="0%" 
                stopColor={theme.isDark ? 'rgba(22, 22, 22, 0.48)' : 'rgba(255, 255, 255, 0.42)'} 
              />
              <Stop 
                offset="100%" 
                stopColor={theme.isDark ? 'rgba(16, 16, 16, 0.42)' : 'rgba(250, 250, 250, 0.36)'} 
              />
            </LinearGradient>
          </Defs>

          {/* 1. Base Glass Plate Backing */}
          <Polygon
            points={outerOctagonPts}
            fill="url(#backingSubtleGrad)"
          />

          {/* 2. 8-Sided High-Translucency Beveled Edge Facets */}
          
          {/* Top Facet (Highlight) */}
          <Polygon 
            points={pts(P1, P2, Q2, Q1)} 
            fill="#ffffff" 
            opacity={theme.isDark ? topHighlightOpacity * 0.45 : topHighlightOpacity} 
          />
          
          {/* Top-Right Facet (Brilliant Corner Highlight) */}
          <Polygon 
            points={pts(P2, P3, Q3, Q2)} 
            fill="#ffffff" 
            opacity={theme.isDark ? topRightHighlightOpacity * 0.55 : topRightHighlightOpacity} 
          />
          
          {/* Right Facet (Highlight) */}
          <Polygon 
            points={pts(P3, P4, Q4, Q3)} 
            fill="#ffffff" 
            opacity={theme.isDark ? rightHighlightOpacity * 0.45 : rightHighlightOpacity} 
          />

          {/* Top-Left Facet (Transitional shading) */}
          <Polygon 
            points={pts(P8, P1, Q1, Q8)} 
            fill={theme.isDark ? '#ffffff' : '#d8d8d8'} 
            opacity={topLeftShadeOpacity} 
          />

          {/* Bottom-Right Facet (Transitional shading) */}
          <Polygon 
            points={pts(P4, P5, Q5, Q4)} 
            fill={theme.isDark ? '#ffffff' : '#d8d8d8'} 
            opacity={bottomRightShadeOpacity} 
          />

          {/* Left Facet (Shadow) */}
          <Polygon 
            points={pts(P7, P8, Q8, Q7)} 
            fill="#000000" 
            opacity={theme.isDark ? leftShadowOpacity * 1.6 : leftShadowOpacity * 1.1} 
          />

          {/* Bottom Facet (Shadow) */}
          <Polygon 
            points={pts(P5, P6, Q6, Q5)} 
            fill="#000000" 
            opacity={theme.isDark ? bottomShadowOpacity * 1.6 : bottomShadowOpacity * 1.1} 
          />

          {/* Bottom-Left Facet (Deep Corner Shadow) */}
          <Polygon 
            points={pts(P6, P7, Q7, Q6)} 
            fill="#000000" 
            opacity={theme.isDark ? bottomLeftShadowOpacity * 1.75 : bottomLeftShadowOpacity * 1.2} 
          />

          {/* 3. Flat Central Table Octagon (Clean Uniform Color & Very Slight Translucency) */}
          <Polygon
            points={innerOctagonPts}
            fill={tableFillColor}
          />

          {/* 4. Sharp Structural Facet Junction Lines */}
          {/* Outer Gem Frame Border */}
          <Polygon
            points={outerOctagonPts}
            fill="transparent"
            stroke={currentBorderColor}
            strokeWidth={1.8}
          />

          {/* Inner Table Bevel Outline (Thicker: 1.8) */}
          <Polygon
            points={innerOctagonPts}
            fill="transparent"
            stroke={innerLineColor}
            strokeWidth={1.8}
          />

          {/* Diagonal Corner Cut lines (Thicker: 1.5) */}
          <Line x1={P1.x} y1={P1.y} x2={Q1.x} y2={Q1.y} stroke={innerLineColor} strokeWidth={1.5} />
          <Line x1={P2.x} y1={P2.y} x2={Q2.x} y2={Q2.y} stroke={innerLineColor} strokeWidth={1.5} />
          <Line x1={P3.x} y1={P3.y} x2={Q3.x} y2={Q3.y} stroke={innerLineColor} strokeWidth={1.5} />
          <Line x1={P4.x} y1={P4.y} x2={Q4.x} y2={Q4.y} stroke={innerLineColor} strokeWidth={1.5} />
          <Line x1={P5.x} y1={P5.y} x2={Q5.x} y2={Q5.y} stroke={innerLineColor} strokeWidth={1.5} />
          <Line x1={P6.x} y1={P6.y} x2={Q6.x} y2={Q6.y} stroke={innerLineColor} strokeWidth={1.5} />
          <Line x1={P7.x} y1={P7.y} x2={Q7.x} y2={Q7.y} stroke={innerLineColor} strokeWidth={1.5} />
          <Line x1={P8.x} y1={P8.y} x2={Q8.x} y2={Q8.y} stroke={innerLineColor} strokeWidth={1.5} />

          {/* 5. Thicker Specular Highlight Glint (2.0) along top-right inner edges */}
          <Line 
            x1={Q1.x} y1={Q1.y} x2={Q2.x} y2={Q2.y} 
            stroke="#ffffff" 
            strokeWidth={2.0} 
            opacity={specularOpacity}
          />
          <Line 
            x1={Q2.x} y1={Q2.y} x2={Q3.x} y2={Q3.y} 
            stroke="#ffffff" 
            strokeWidth={2.0} 
            opacity={specularOpacity}
          />
          <Line 
            x1={Q3.x} y1={Q3.y} x2={Q4.x} y2={Q4.y} 
            stroke="#ffffff" 
            strokeWidth={1.8} 
            opacity={specularOpacity * 0.8}
          />
        </Svg>
      )}
      <View style={[
        styles.contentWrapper, 
        isFlex && { flex: 1 }, 
        { padding: activeInset + 8 }, 
        contentStyle
      ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    borderWidth: 0,
    shadowColor: 'transparent',
    elevation: 0,
    overflow: 'visible',
  },
  contentWrapper: {
    width: '100%',
    zIndex: 10, // Ensure inputs and scrollable content are drawn on top of the background SVG
  }
});
