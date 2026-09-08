import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { theme } from '../constants/theme';

interface Props {
    xgbScore: number;
    rfScore: number;
    ensembleScore: number;
    verdictColor: string;
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 160;
const PADDING_LEFT = 35;
const PADDING_RIGHT = 15;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 30;

const DRAW_WIDTH = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const DRAW_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

export default function ModelLineChart({ xgbScore, rfScore, ensembleScore, verdictColor }: Props) {
    const xgbPct = Math.round(xgbScore * 100);
    const rfPct = Math.round(rfScore * 100);
    const ensPct = Math.round(ensembleScore * 100);

    const getY = (val: number) => {
        const ratio = Math.min(Math.max(val / 100, 0), 1);
        return PADDING_TOP + (1 - ratio) * DRAW_HEIGHT;
    };

    const x0 = PADDING_LEFT;
    const x1 = PADDING_LEFT + DRAW_WIDTH * 0.33;
    const x2 = PADDING_LEFT + DRAW_WIDTH * 0.66;
    const x3 = PADDING_LEFT + DRAW_WIDTH;

    const yXgb0 = getY(0);
    const yXgb1 = getY(25);
    const yXgb2 = getY(xgbPct);
    const yXgb3 = getY(xgbPct);

    const yRf0 = getY(0);
    const yRf1 = getY(20);
    const yRf2 = getY(rfPct);
    const yRf3 = getY(rfPct);

    const yEns0 = getY(0);
    const yEns1 = getY(15);
    const yEns2 = getY(ensPct);
    const yEns3 = getY(ensPct);

    const pathXgb = `M ${x0} ${yXgb0} C ${x0 + 20} ${yXgb1}, ${x1 - 10} ${yXgb1}, ${x1} ${yXgb1} S ${x2 - 10} ${yXgb2}, ${x2} ${yXgb2} L ${x3} ${yXgb3}`;
    const pathRf = `M ${x0} ${yRf0} C ${x0 + 20} ${yRf1}, ${x1 - 10} ${yRf1}, ${x1} ${yRf1} S ${x2 - 10} ${yRf2}, ${x2} ${yRf2} L ${x3} ${yRf3}`;
    const pathEns = `M ${x0} ${yEns0} C ${x0 + 20} ${yEns1}, ${x1 - 10} ${yEns1}, ${x1} ${yEns1} S ${x2 - 10} ${yEns2}, ${x2} ${yEns2} L ${x3} ${yEns3}`;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Model confidence comparison</Text>
                <Text style={styles.subtitle}>How each model scored this URL</Text>
            </View>

            <View style={styles.chartWrap}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                    <Defs>
                        <SvgGradient id="xgbGrad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor="#818CF8" stopOpacity="0.4" />
                            <Stop offset="1" stopColor="#818CF8" stopOpacity="0.0" />
                        </SvgGradient>
                        <SvgGradient id="rfGrad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor="#34D399" stopOpacity="0.4" />
                            <Stop offset="1" stopColor="#34D399" stopOpacity="0.0" />
                        </SvgGradient>
                    </Defs>

                    {[0, 50, 100].map((gridVal) => {
                        const y = getY(gridVal);
                        return (
                            <React.Fragment key={gridVal}>
                                <Line
                                    x1={PADDING_LEFT}
                                    y1={y}
                                    x2={CHART_WIDTH - PADDING_RIGHT}
                                    y2={y}
                                    stroke="rgba(255, 255, 255, 0.08)"
                                    strokeDasharray="4 4"
                                    strokeWidth="1"
                                />
                            </React.Fragment>
                        );
                    })}

                    <Path d={pathXgb} fill="none" stroke="#818CF8" strokeWidth="2.5" />
                    <Path d={pathRf} fill="none" stroke="#34D399" strokeWidth="2.5" />
                    <Path d={pathEns} fill="none" stroke={verdictColor} strokeWidth="3.5" />

                    <Circle cx={x3} cy={yXgb3} r="4" fill="#818CF8" />
                    <Circle cx={x3} cy={yRf3} r="4" fill="#34D399" />
                    <Circle cx={x3} cy={yEns3} r="5" fill={verdictColor} stroke="#FFF" strokeWidth="1.5" />
                </Svg>
            </View>

            <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#818CF8' }]} />
                    <Text style={styles.legendLabel}>XGBoost ({xgbPct}%)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#34D399' }]} />
                    <Text style={styles.legendLabel}>Random Forest ({rfPct}%)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: verdictColor }]} />
                    <Text style={styles.legendLabel}>Ensemble ({ensPct}%)</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111827',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 14,
    },
    header: {
        marginBottom: 10,
    },
    title: {
        color: '#F9FAFB',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 2,
    },
    chartWrap: {
        alignItems: 'center',
        marginVertical: 4,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendLabel: {
        color: '#D1D5DB',
        fontSize: 11,
        fontWeight: '600',
    },
});
