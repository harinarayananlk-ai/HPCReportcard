import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient, Stop, Path, Rect, Polyline, RadialGradient } from 'react-native-svg';
import { gems } from '../colour_themes';

/**
 * GemAccent — A small, realistic gemstone icon for decorative use.
 * Renders a faceted gem with multi-gradient depth, diagonal highlight
 * streaks for light refraction, and edge cut lines.
 * 
 * Props:
 *   gemType: 'sapphire' | 'emerald' | 'topaz' | 'ruby' | 'pearl'
 *   size: number (default 24)
 *   style: ViewStyle
 */

const GEM_PALETTES = {
    sapphire: {
        center: '#1460D9', top1: '#FFFFFF', top2: '#8ABBF5',
        left1: '#D0E3F8', left2: '#3F8DF5', bottom1: '#0B3A82',
        bottom2: '#041530', right1: '#0D4499', right2: '#061C40',
        glow: '#4A90E2', sparkle: '#B8D4F8',
    },
    silver: {
        center: '#D8D4D0', top1: '#FFFFFF', top2: '#F0EDE8',
        left1: '#FAFAF8', left2: '#E8E4E0', bottom1: '#B0ACA8',
        bottom2: '#888480', right1: '#C8C4C0', right2: '#A0A098',
        glow: '#E5E4E2', sparkle: '#FFFFFF',
    },
};

// Aliases for backward compatibility
GEM_PALETTES.pearl = GEM_PALETTES.silver;
GEM_PALETTES.emerald = GEM_PALETTES.silver;
GEM_PALETTES.topaz = GEM_PALETTES.sapphire;
GEM_PALETTES.ruby = GEM_PALETTES.sapphire;

export default function GemAccent({ gemType = 'sapphire', size = 24, style }) {
    const p = GEM_PALETTES[gemType] || GEM_PALETTES.sapphire;
    const td = 22; // top depth %
    const sd = 12; // side depth %

    const p1 = `${sd},${td}`;
    const p2 = `${100 - sd},${td}`;
    const p3 = `${100 - sd},${100 - td}`;
    const p4 = `${sd},${100 - td}`;

    return (
        <View style={[{ width: size, height: size }, style]}>
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
                <Defs>
                    <LinearGradient id="ga_top" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={p.top1} />
                        <Stop offset="100%" stopColor={p.top2} />
                    </LinearGradient>
                    <LinearGradient id="ga_left" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={p.left1} />
                        <Stop offset="100%" stopColor={p.left2} />
                    </LinearGradient>
                    <LinearGradient id="ga_bottom" x1="0%" y1="100%" x2="0%" y2="0%">
                        <Stop offset="0%" stopColor={p.bottom1} />
                        <Stop offset="100%" stopColor={p.bottom2} />
                    </LinearGradient>
                    <LinearGradient id="ga_right" x1="100%" y1="0%" x2="0%" y2="0%">
                        <Stop offset="0%" stopColor={p.right1} />
                        <Stop offset="100%" stopColor={p.right2} />
                    </LinearGradient>
                    <LinearGradient id="ga_center" x1="20%" y1="20%" x2="80%" y2="80%">
                        <Stop offset="0%" stopColor={p.sparkle} stopOpacity="0.4" />
                        <Stop offset="40%" stopColor={p.center} />
                        <Stop offset="100%" stopColor={p.bottom1} />
                    </LinearGradient>
                    <RadialGradient id="ga_glow" cx="35%" cy="35%" r="60%">
                        <Stop offset="0%" stopColor={p.sparkle} stopOpacity="0.6" />
                        <Stop offset="100%" stopColor={p.center} stopOpacity="0" />
                    </RadialGradient>
                </Defs>

                {/* Outer facets */}
                <Polygon points={`0,0 100,0 ${p2} ${p1}`} fill="url(#ga_top)" opacity={0.85} />
                <Polygon points={`0,100 100,100 ${p3} ${p4}`} fill="url(#ga_bottom)" opacity={0.85} />
                <Polygon points={`0,0 ${p1} ${p4} 0,100`} fill="url(#ga_left)" opacity={0.85} />
                <Polygon points={`100,0 ${p2} ${p3} 100,100`} fill="url(#ga_right)" opacity={0.85} />

                {/* Center facet */}
                <Polygon points={`${p1} ${p2} ${p3} ${p4}`} fill="url(#ga_center)" />

                {/* Inner glow for depth */}
                <Polygon points={`${p1} ${p2} ${p3} ${p4}`} fill="url(#ga_glow)" />

                {/* Cut lines */}
                <Polyline points={`0,0 ${p1}`} stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
                <Polyline points={`100,0 ${p2}`} stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
                <Polyline points={`0,100 ${p4}`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                <Polyline points={`100,100 ${p3}`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                <Polygon points={`${p1} ${p2} ${p3} ${p4}`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />

                {/* Primary refraction highlight — sharp diagonal shard */}
                <Path d="M 8 0 L 22 0 L 42 100 L 28 100 Z" fill="rgba(255,255,255,0.5)" />
                {/* Secondary thin highlight */}
                <Path d="M 58 0 L 62 0 L 82 100 L 78 100 Z" fill="rgba(255,255,255,0.22)" />
                {/* Tiny sparkle dot */}
                <Path d="M 28 18 L 30 14 L 32 18 L 30 22 Z" fill="rgba(255,255,255,0.9)" />

                {/* Thin border */}
                <Rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" rx="2" ry="2" />
            </Svg>
        </View>
    );
}
