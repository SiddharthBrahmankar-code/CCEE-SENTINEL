
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Feather } from '@expo/vector-icons';
import { useGlobalStore } from '../store/GlobalStore';
import { modulesApi } from '../services/systemService';
import { notesService } from '../services/notesService';

// Types
type ViewMode = 'MODULES' | 'TOPICS' | 'READER';

export const NotesScreen = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('MODULES');
    const [modules, setModules] = useState<any[]>([]);
    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const { getNoteFromCache, addNoteToCache } = useGlobalStore();

    useEffect(() => {
        loadModules();
    }, []);

    const loadModules = async () => {
        try {
            setLoading(true);
            const res = await modulesApi.getAll();
            setModules(res.data);
            setLoading(false);
        } catch (err: any) {
            setError('Failed to load modules: ' + err.message);
            setLoading(false);
        }
    };

    const handleModuleSelect = (module: any) => {
        setSelectedModule(module);
        setViewMode('TOPICS');
    };

    const handleTopicSelect = async (topic: string) => {
        setSelectedTopic(topic);
        setViewMode('READER');
        setLoading(true);
        setError(null);

        // check cache first
        const cacheKey = `${selectedModule.id}:${topic}`;
        const cached = getNoteFromCache(cacheKey);

        if (cached) {
            setContent(cached.data);
            setLoading(false);
            return;
        }

        // Try to generate (Note: Mobile currently stubs this, so it might fail or return a stub message)
        try {
           const note = await notesService.generateNote(selectedModule.id, topic);
           setContent(note.content);
           addNoteToCache(cacheKey, note.content);
        } catch (err: any) {
           setError("AI Generation Unavailable on Mobile.\n\n" + (err.message || "Unknown Error"));
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        if (viewMode === 'READER') setViewMode('TOPICS');
        else if (viewMode === 'TOPICS') setViewMode('MODULES');
    };

    // --- RENDERERS ---

    const renderHeader = () => (
        <View style={styles.header}>
            {viewMode !== 'MODULES' && (
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#00f0ff" />
                </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>
                {viewMode === 'MODULES' ? 'LIBRARY' : 
                 viewMode === 'TOPICS' ? selectedModule?.title?.toUpperCase() : 
                 'NEURAL LINK'}
            </Text>
        </View>
    );

    if (loading && !content && viewMode === 'READER') {
         return (
             <View style={styles.container}>
                 {renderHeader()}
                 <View style={styles.center}>
                     <ActivityIndicator size="large" color="#00f0ff" />
                     <Text style={styles.loadingText}>Synthesizing Knowledge...</Text>
                 </View>
             </View>
         );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}

            {viewMode === 'MODULES' && (
                <ScrollView contentContainerStyle={styles.list}>
                    {loading ? <ActivityIndicator color="#00f0ff" /> : modules.map((m, i) => (
                        <TouchableOpacity key={i} style={styles.card} onPress={() => handleModuleSelect(m)}>
                            <View style={styles.iconBox}>
                                <Feather name="folder" size={24} color="#00f0ff" />
                            </View>
                            <View>
                                <Text style={styles.cardTitle}>{m.title}</Text>
                                <Text style={styles.cardSub}>{m.topics.length} Topics</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#64748b" style={{marginLeft:'auto'}}/>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {viewMode === 'TOPICS' && (
                <ScrollView contentContainerStyle={styles.list}>
                    {selectedModule?.topics.map((t: string, i: number) => (
                        <TouchableOpacity key={i} style={styles.card} onPress={() => handleTopicSelect(t)}>
                             <Text style={styles.topicText}>{t}</Text>
                             <Feather name="play" size={16} color="#64748b" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {viewMode === 'READER' && (
                <ScrollView style={styles.reader} contentContainerStyle={{paddingBottom: 100}}>
                    <Text style={styles.topicHeader}>{selectedTopic}</Text>
                    {error ? (
                        <View style={styles.errorBox}>
                            <Feather name="alert-triangle" size={32} color="#ef4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : (
                        <Markdown style={markdownStyles}>
                            {content}
                        </Markdown>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050510',
    },
    header: {
        height: 70,
        backgroundColor: '#0a0a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        marginRight: 16,
        padding: 8,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    list: {
        padding: 20,
        gap: 16,
    },
    card: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1e293b',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    cardTitle: {
        color: '#f1f5f9',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardSub: {
        color: '#94a3b8',
        fontSize: 13,
    },
    topicText: {
        color: '#e2e8f0',
        fontSize: 16,
        flex: 1,
        fontWeight: '500',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#94a3b8',
        marginTop: 16,
        fontSize: 14,
        letterSpacing: 1,
    },
    reader: {
        flex: 1,
        padding: 20,
    },
    topicHeader: {
        color: '#00f0ff',
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 30,
        lineHeight: 34,
    },
    errorBox: {
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        lineHeight: 24,
    }
});

const markdownStyles = {
    body: { color: '#cbd5e1', fontSize: 17, lineHeight: 28 },
    heading1: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginVertical: 16 },
    heading2: { color: '#e2e8f0', fontSize: 22, fontWeight: 'bold', marginVertical: 12, marginTop: 24 },
    code_block: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, borderWidth:1, borderColor:'#334155', marginVertical: 12 },
    code_inline: { backgroundColor: '#1e293b', color: '#00f0ff', paddingHorizontal: 6, borderRadius: 4 },
    list_item: { marginBottom: 8 },
};
