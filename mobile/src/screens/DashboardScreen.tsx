import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalStore } from '../store/GlobalStore';
import { modulesApi } from '../services/systemService';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
  const history = useGlobalStore(state => state.history);
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState('Checking Uplink...');
  const [moduleCount, setModuleCount] = useState(0);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
        setStatus('Syncing...');
        const res = await modulesApi.getAll();
        setModuleCount(res.data.length || 0);
        setStatus('ONLINE');
    } catch (e: any) {
        setStatus(`OFFLINE`);
    }
  };

  const StatCard = ({ title, value, icon, color }: any) => (
      <View style={[styles.statCard, { borderColor: color }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
              <Feather name={icon} size={20} color={color} />
          </View>
          <View>
             <Text style={styles.statLabel}>{title}</Text>
             <Text style={styles.statValue}>{value}</Text>
          </View>
      </View>
  );

  const ActionCard = ({ title, sub, icon, target, color }: any) => (
      <TouchableOpacity 
        style={[styles.actionCard, { borderLeftColor: color }]}
        onPress={() => navigation.navigate(target)}
      >
          <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
              <Feather name={icon} size={24} color={color} />
          </View>
          <View style={{flex:1}}>
              <Text style={styles.actionTitle}>{title}</Text>
              <Text style={styles.actionSub}>{sub}</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#64748b" />
      </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
       <ScrollView contentContainerStyle={styles.scroll}>
           <View style={styles.header}>
             <View>
                <Text style={styles.welcome}>WELCOME BACK</Text>
                <Text style={styles.title}>SENTINEL <Text style={styles.highlight}>MOBILE</Text></Text>
             </View>
             <View style={[styles.statusBadge, { backgroundColor: status === 'ONLINE' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }]}>
                 <View style={[styles.dot, { backgroundColor: status === 'ONLINE' ? '#22c55e' : '#ef4444' }]} />
                 <Text style={[styles.statusText, { color: status === 'ONLINE' ? '#22c55e' : '#ef4444' }]}>{status}</Text>
             </View>
           </View>

           <View style={styles.statsGrid}>
              <StatCard title="MODULES" value={moduleCount} icon="database" color="#00f0ff" />
              <StatCard title="ATTEMPTS" value={history.attempts.length} icon="activity" color="#eab308" />
           </View>

           <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>

           <ActionCard 
              title="Continue Study" 
              sub="Resume reading notes" 
              icon="book-open" 
              target="Notes" 
              color="#00f0ff" 
           />
           <ActionCard 
              title="Quick Flashcards" 
              sub="Review memory stack" 
              icon="zap" 
              target="Flash" 
              color="#d946ef" 
           />
           <ActionCard 
              title="Daily Mock" 
              sub="Test your knowledge" 
              icon="target" 
              target="Mock" 
              color="#22c55e" 
           />
            <ActionCard 
              title="Mentor Help" 
              sub="Ask AI Assistant" 
              icon="message-square" 
              target="Chat" 
              color="#3b82f6" 
           />

       </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050510' },
  scroll: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  welcome: { color: '#94a3b8', fontSize: 12, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff' },
  highlight: { color: '#00f0ff' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, borderTopWidth: 2, alignItems: 'center', gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  statLabel: { color: '#94a3b8', fontSize: 10, letterSpacing: 1 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16, letterSpacing: 1 },
  
  actionCard: { 
      flexDirection: 'row', alignItems: 'center', 
      backgroundColor: '#0f172a', padding: 20, borderRadius: 16, 
      marginBottom: 12, borderLeftWidth: 4 
  },
  actionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  actionTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  actionSub: { color: '#64748b', fontSize: 12, marginTop: 2 }
});
