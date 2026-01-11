
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useGlobalStore } from '../store/GlobalStore';
import { modulesApi } from '../services/systemService';
import { flashcardService } from '../services/flashcardService';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Mode = 'SETUP' | 'ACTIVE' | 'SUMMARY';

export const FlashcardScreen = () => {
    const [mode, setMode] = useState<Mode>('SETUP');
    const [modules, setModules] = useState<any[]>([]);
    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [loading, setLoading] = useState(false);
    
    // Cards State
    const [cards, setCards] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [flipAnim] = useState(new Animated.Value(0));

    const { updateCardProgress } = useGlobalStore();

    useEffect(() => {
        loadModules();
    }, []);

    const loadModules = async () => {
         try {
             const res = await modulesApi.getAll();
             setModules(res.data);
         } catch (e) {
             console.error(e);
         }
    };

    const startSession = async (topic: string) => {
        setSelectedTopic(topic);
        setLoading(true);
        try {
            // Mobile stub - this will likely fail unless we add cache later
            const res = await flashcardService.generate(selectedModule.id, topic) as any;
            if (res && res.flashcards) {
                setCards(res.flashcards);
                setCurrentIndex(0);
                setIsFlipped(false);
                setMode('ACTIVE');
            }
        } catch (e: any) {
             // Fallback for demo if AI fails
             alert("AI Unavailable: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const flipCard = () => {
        Animated.spring(flipAnim, {
            toValue: isFlipped ? 0 : 180,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
        setIsFlipped(!isFlipped);
    };

    const handleRate = (quality: number) => {
        const card = cards[currentIndex];
        // Generate a pseudo-ID for the card based on content
        const cardId = `${selectedModule.id}:${selectedTopic}:${currentIndex}`; 
        updateCardProgress(cardId, quality);

        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            flipAnim.setValue(0);
        } else {
            setMode('SUMMARY');
        }
    };

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const frontOpacity = flipAnim.interpolate({
        inputRange: [89, 90],
        outputRange: [1, 0],
    });

    const backOpacity = flipAnim.interpolate({
        inputRange: [89, 90],
        outputRange: [0, 1],
    });


    // --- RENDERERS ---

    if (mode === 'SETUP') {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>MEMORY MATRIX</Text>
                
                {selectedModule ? (
                    <>
                        <TouchableOpacity onPress={() => setSelectedModule(null)} style={styles.backLink}>
                             <Feather name="arrow-left" size={16} color="#64748b" />
                             <Text style={styles.backText}>{selectedModule.name}</Text>
                        </TouchableOpacity>
                        <ScrollView style={styles.list}>
                            {selectedModule.topics.map((t: string, i: number) => (
                                <TouchableOpacity key={i} style={styles.cardItem} onPress={() => startSession(t)}>
                                    <View style={styles.iconBox}><Feather name="zap" size={16} color="#00f0ff" /></View>
                                    <Text style={styles.cardText}>{t}</Text>
                                    {loading && <ActivityIndicator color="#00f0ff" size="small" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                ) : (
                    <ScrollView style={styles.list}>
                        <Text style={styles.subHeader}>SELECT MODULE</Text>
                        {modules.map(m => (
                            <TouchableOpacity key={m.id} style={styles.cardItem} onPress={() => setSelectedModule(m)}>
                                <View style={styles.iconBox}><Feather name="folder" size={16} color="#00f0ff" /></View>
                                <Text style={styles.cardText}>{m.name}</Text>
                                <Feather name="chevron-right" size={16} color="#64748b" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        );
    }

    if (mode === 'ACTIVE') {
        const card = cards[currentIndex];
        return (
            <View style={styles.container}>
                <View style={styles.topBar}>
                    <Text style={styles.progressText}>{currentIndex + 1} / {cards.length}</Text>
                    <TouchableOpacity onPress={() => setMode('SETUP')}><Feather name="x" size={24} color="#64748b" /></TouchableOpacity>
                </View>

                <View style={styles.cardContainer}>
                    <TouchableOpacity activeOpacity={1} onPress={flipCard} style={styles.cardWrapper}>
                        <Animated.View style={[styles.flashcard, { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity }]}>
                            <Text style={styles.cardLabel}>FRONT</Text>
                            <Text style={styles.cardContent}>{card.front}</Text>
                            <Text style={styles.tapHint}>Tap to Flip</Text>
                        </Animated.View>
                        <Animated.View style={[styles.flashcard, styles.flashcardBack, { transform: [{ rotateY: backInterpolate }], opacity: backOpacity }]}>
                            <Text style={styles.cardLabel}>BACK</Text>
                            <Text style={styles.cardContent}>{card.back}</Text>
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {isFlipped && (
                    <View style={styles.controls}>
                        <TouchableOpacity style={[styles.btn, {borderColor:'#ef4444', backgroundColor:'#ef444420'}]} onPress={() => handleRate(1)}>
                            <Text style={{color:'#ef4444', fontWeight:'bold'}}>AGAIN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, {borderColor:'#eab308', backgroundColor:'#eab30820'}]} onPress={() => handleRate(3)}>
                            <Text style={{color:'#eab308', fontWeight:'bold'}}>GOOD</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, {borderColor:'#22c55e', backgroundColor:'#22c55e20'}]} onPress={() => handleRate(5)}>
                            <Text style={{color:'#22c55e', fontWeight:'bold'}}>EASY</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }

    if (mode === 'SUMMARY') {
        return (
            <View style={styles.center}>
                <Feather name="check-circle" size={64} color="#00f0ff" />
                <Text style={styles.header}>SESSION COMPLETE</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setMode('SETUP')}>
                    <Text style={[styles.cardText, {color:'#000'}]}>CONTINUE</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050510', padding: 20 },
    center: { flex: 1, backgroundColor: '#050510', alignItems: 'center', justifyContent: 'center' },
    header: { color: '#00f0ff', fontSize: 24, fontWeight: '900', marginBottom: 20, letterSpacing: 1 },
    subHeader: { color: '#64748b', marginBottom: 16, fontSize: 12, letterSpacing: 2, fontWeight: 'bold' },
    backLink: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8, padding: 8 },
    backText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
    list: { flex: 1 },
    cardItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a',
        padding: 18, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b'
    },
    iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,240,255,0.1)', alignItems:'center', justifyContent:'center', marginRight: 16 },
    cardText: { color: '#f1f5f9', fontSize: 16, fontWeight: '600', flex: 1 },
    
    // Flashcard
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    progressText: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
    cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
    flashcard: {
        width: SCREEN_WIDTH - 48,
        height: 420,
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        position: 'absolute',
    },
    flashcardBack: {
        backgroundColor: '#020617',
        borderColor: '#00f0ff',
        transform: [{ rotateY: '180deg' }]
    },
    cardLabel: { color: '#64748b', fontSize: 12, position: 'absolute', top: 30, letterSpacing: 2, fontWeight: '700' },
    cardContent: { color: '#fff', fontSize: 26, textAlign: 'center', fontWeight: 'bold', lineHeight: 36 },
    tapHint: { color: '#64748b', position: 'absolute', bottom: 30, fontSize: 12, fontWeight: '600' },
    
    controls: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, width: '100%' },
    btn: { 
        flex: 1, 
        paddingVertical: 16, 
        borderRadius: 16, 
        borderWidth: 1, 
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    primaryBtn: { backgroundColor: '#00f0ff', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, marginTop: 30, alignItems: 'center' }

});
