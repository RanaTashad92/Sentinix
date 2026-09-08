import React from 'react';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

interface Props {
    size?: number;
    color1?: string;
    color2?: string;
}

export default function AppIcon({ size = 28, color1 = '#818CF8', color2 = '#4F46E5' }: Props) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Defs>
                <SvgGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={color1} />
                    <Stop offset="100%" stopColor={color2} />
                </SvgGradient>
            </Defs>
            {/* Outer Shield Outline */}
            <Path
                d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
                fill="url(#shieldGrad)"
            />
            {/* Inner Security Check/Node */}
            <Path
                d="M9 11.5l2 2 4.5-4.5"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
