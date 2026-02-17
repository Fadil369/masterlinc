import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MasterLinc</Text>
      <Text style={styles.subtitle}>Your Healthcare Companion</Text>
      
      <View style={styles.grid}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Appointments')}
        >
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardTitle}>Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Telehealth')}
        >
          <Text style={styles.cardIcon}>📹</Text>
          <Text style={styles.cardTitle}>Video Consult</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Prescriptions')}
        >
          <Text style={styles.cardIcon}>💊</Text>
          <Text style={styles.cardTitle}>Prescriptions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardIcon}>📊</Text>
          <Text style={styles.cardTitle}>Health Records</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066cc',
    marginTop: 20
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  }
})
