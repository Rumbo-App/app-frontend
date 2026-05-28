import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, Animated, PanResponder, Dimensions, Easing } from 'react-native';

interface StopMenuProps {
    stop: any;
    onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_MENU_HEIGHT = 220;

export const StopMenu = ({ stop, onClose }: StopMenuProps) => {
    // Keep a local copy of the stop data to prevent "Unknown Stop" during close animation
    const [localStop, setLocalStop] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (stop) {
            // If it's a new stop or the menu was closed
            setIsLoading(true);
            setLocalStop(stop);
            contentOpacity.setValue(0);
            
            // Pop effect
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.02,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
            ]).start();

            // Start rotation animation for loading
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.linear,
                })
            ).start();

            // Animate up to show the menu
            Animated.spring(translateY, {
                toValue: SCREEN_HEIGHT - MIN_MENU_HEIGHT,
                useNativeDriver: true,
                damping: 15,
                stiffness: 100,
            }).start();

            // Simulate data charging (loading)
            const timer = setTimeout(() => {
                setIsLoading(false);
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            }, 800);

            return () => {
                clearTimeout(timer);
                rotateAnim.stopAnimation();
            };
        } else {
            // Animate down to hide the menu
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start(() => {
                // Clear local data only after animation finishes
                setLocalStop(null);
                setIsLoading(false);
                contentOpacity.setValue(0);
            });
        }
    }, [stop]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderGrant: () => {
                // Use extractOffset to move the current value into the offset
                // This prevents the "jump" and ensures smooth dragging from any position
                translateY.extractOffset();
            },
            onPanResponderMove: Animated.event(
                [null, { dy: translateY }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                // Flatten the offset back into the value so the next animation starts correctly
                translateY.flattenOffset();
                
                if (gestureState.dy > 80) {
                    onClose();
                } else {
                    // Snap back to default position
                    Animated.spring(translateY, {
                        toValue: SCREEN_HEIGHT - MIN_MENU_HEIGHT,
                        useNativeDriver: true,
                        damping: 15,
                        stiffness: 100,
                    }).start();
                }
            },
        })
    ).current;

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Use localStop so content stays visible during the entire closing animation
    if (!localStop) return null;

    return (
        <Animated.View 
            style={[
                styles.container, 
                { transform: [{ translateY: translateY }, { scale: scaleAnim }] }
            ]}
        >
            <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
            </View>
            
            <View style={styles.contentContainer}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <View style={styles.skeletonHeader}>
                            <View style={styles.skeletonTitle} />
                            <View style={styles.skeletonBadge} />
                        </View>
                        <View style={styles.skeletonDivider} />
                        <View style={styles.skeletonRow} />
                        <View style={styles.skeletonRow} />
                        <View style={styles.skeletonLarge} />
                        
                        <View style={styles.spinnerContainer}>
                            <Animated.View 
                                style={[
                                    styles.spinner, 
                                    { transform: [{ rotate: spin }] }
                                ]} 
                            />
                            <Text style={styles.loadingText}>Cargando datos...</Text>
                        </View>
                    </View>
                ) : (
                    <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{localStop.location || 'Parada Sin Nombre'}</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{localStop.code}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Estado:</Text>
                            <Text style={styles.infoValue}>Operativa</Text>
                        </View>
                        
                        <Text style={styles.placeholder}>Próximos arribos aparecerán aquí.</Text>
                    </Animated.View>
                )}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT,
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
        zIndex: 1000,
    },
    dragHandleContainer: {
        width: '100%',
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#E0E0E0',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        paddingTop: 10,
        gap: 15,
    },
    skeletonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skeletonTitle: {
        height: 24,
        width: '60%',
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
    },
    skeletonBadge: {
        height: 24,
        width: 60,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
    },
    skeletonDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 5,
    },
    skeletonRow: {
        height: 16,
        width: '40%',
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
    },
    skeletonLarge: {
        height: 60,
        width: '100%',
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        marginTop: 5,
    },
    spinnerContainer: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinner: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 3,
        borderColor: '#22c000',
        borderTopColor: 'transparent',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    content: {
        gap: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 10,
    },
    badge: {
        backgroundColor: '#F0F9EB',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#22c000',
    },
    badgeText: {
        color: '#22c000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        width: 60,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    placeholder: {
        marginTop: 10,
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#DDD',
    },
});
