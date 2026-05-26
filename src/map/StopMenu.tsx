import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, Animated, PanResponder, Dimensions } from 'react-native';

interface StopMenuProps {
    stop: any;
    onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_MENU_HEIGHT = 200;

export const StopMenu = ({ stop, onClose }: StopMenuProps) => {
    // Keep a local copy of the stop data to prevent "Unknown Stop" during close animation
    const [localStop, setLocalStop] = useState(stop);
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (stop) {
            setLocalStop(stop);
            // Animate up to show the menu
            Animated.spring(translateY, {
                toValue: SCREEN_HEIGHT - MIN_MENU_HEIGHT,
                useNativeDriver: true,
                bounciness: 4,
            }).start();
        } else {
            // Animate down to hide the menu
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start(() => {
                // Clear local data only after animation finishes
                setLocalStop(null);
            });
        }
    }, [stop]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderGrant: () => {
                // @ts-ignore
                translateY.setOffset(translateY._value);
                translateY.setValue(0);
            },
            onPanResponderMove: Animated.event(
                [null, { dy: translateY }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                translateY.flattenOffset();
                if (gestureState.dy > 50) {
                    onClose();
                } else {
                    Animated.spring(translateY, {
                        toValue: SCREEN_HEIGHT - MIN_MENU_HEIGHT,
                        useNativeDriver: true,
                        bounciness: 4,
                    }).start();
                }
            },
        })
    ).current;

    // Use localStop so content stays visible during the entire closing animation
    if (!localStop) return null;

    return (
        <Animated.View 
            style={[
                styles.container, 
                { transform: [{ translateY: translateY }] }
            ]}
        >
            <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{localStop.location || 'Unknown Stop'}</Text>
                <Text style={styles.info}>Code: {localStop.code}</Text>
                <Text style={styles.placeholder}>[Placeholder for more details]</Text>
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
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 10,
        zIndex: 1000,
    },
    dragHandleContainer: {
        width: '100%',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#ccc',
    },
    content: {
        padding: 20,
        paddingTop: 0,
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    info: {
        fontSize: 16,
        color: '#666',
    },
    placeholder: {
        marginTop: 10,
        fontStyle: 'italic',
        color: '#999',
    },
});
