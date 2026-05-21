import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name: string;
}

interface SearchBarProps {
  onLocationSelect: (lon: number, lat: number) => void;
}

export const SearchBar = ({ onLocationSelect }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 3) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (text: string) => {
    const url = `https://casaservidor.myddns.me/nominatim/search?q=${encodeURIComponent(text)}&format=json`;

    try {
      const response = await fetch(url);
      const json = await response.json();
      // Nominatim might return an error object or an array. We expect an array.
      if (Array.isArray(json)) {
        setResults(json as NominatimResult[]);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error("Error en búsqueda:", e);
      setResults([]);
    }
  };

  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.input}
        placeholder="Buscar lugar o parada..."
        placeholderTextColor="#666"
        value={query}
        onChangeText={setQuery}
      />
      {results.length > 0 && (
        <View style={styles.resultsList}>
          {results.map((item, index) => (
            <TouchableOpacity
              key={item.place_id || index}
              onPress={() => {
                const lon = parseFloat(item.lon);
                const lat = parseFloat(item.lat);
                onLocationSelect(lon, lat);
                setResults([]);
                setQuery(item.name || item.display_name.split(',')[0]);
              }}
              style={styles.resultItem}
            >
              <Text style={styles.mainText} numberOfLines={1}>
                {item.name || item.display_name.split(',')[0]}
              </Text>
              <Text style={styles.cityText} numberOfLines={2}>
                {item.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    position: 'absolute',
    top: 50,
    width: '92%',
    alignSelf: 'center',
    zIndex: 999, // Asegura que esté por encima del mapa
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    color: 'black'
  },
  resultsList: {
    backgroundColor: 'white',
    marginTop: 5,
    borderRadius: 10,
    elevation: 5,
    maxHeight: 300,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  mainText: { fontSize: 16, color: '#333' },
  cityText: { fontSize: 12, color: '#999' }
});