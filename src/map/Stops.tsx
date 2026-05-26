import React from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

interface StopsLayerProps {
    data: any;
    isLoading: boolean;
    onStopPress?: (stop: any) => void;
    selectedStopId?: number | null;
}

export const StopsLayer = ({ data, isLoading, onStopPress, selectedStopId }: StopsLayerProps) => {
    if (isLoading || !data?.features || data.features.length === 0) {
        return null;
    }

    const handlePress = (event: any) => {
        // Prevent event from bubbling to Map.onPress immediately
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        
        const features = event.nativeEvent?.features || event.features;
        if (onStopPress && features && features.length > 0) {
            const feature = features[0];
            
            // Skip if it's a cluster - clusters are handled by the native engine
            if (feature.properties?.cluster || feature.properties?.point_count) {
                return;
            }

            onStopPress(feature.properties);
        }
    };

    return (
        <GeoJSONSource 
            id="stops-source" 
            data={data} 
            cluster={true} 
            clusterRadius={35}
            onPress={handlePress}
            hitbox={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
            {/* CLUSTERS */}
            <Layer
                id="stops-clusters"
                type="circle"
                filter={['has', 'point_count']}
                paint={{
                    'circle-radius':7,
                    'circle-color': '#1b8d00',
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                }}
            />

            {/* 2. THE ID TAG (Text on top) */}
            <Layer
                id="stops-points-labels"
                type="symbol" // Symbol type allows text
                filter={['!', ['has', 'point_count']]}
                layout={{
                    // This pulls the 'code' field from your properties
                    'text-field': ['get', 'code'],
                    'text-size': 12,
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top',
                    'text-font': ['Noto Sans Regular'],
                }}
                paint={{
                    'text-color': '#ffffff',
                    'text-halo-color': '#000000',
                    'text-halo-width': 1,
                }}
            />

            {/* INDIVIDUAL POINTS */}
            <Layer
                id="stops-points"
                type="circle"
                filter={['!', ['has', 'point_count']]}
                paint={{
                    // Increase radius if selected
                    'circle-radius': [
                        'case',
                        ['==', ['get', 'id'], selectedStopId || -1],
                        12,
                        7
                    ],
                    'circle-color': '#22c000',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                }}
            />
        </GeoJSONSource>
    );
};
