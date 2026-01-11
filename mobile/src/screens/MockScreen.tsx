
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useGlobalStore, Question } from '../store/GlobalStore';
import { modulesApi } from '../services/systemService';
import { mockService } from '../services/mockService';

type Mode = 'SETUP' | 'QUIZ' | 'RESULT';

export const MockScreen = () => {
    const [mode, setMode] = useState<Mode>('SETUP');
    const [modules, setModules] = useState<any[]>([]);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Quiz State
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [score, setScore] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const { addMockAttempt } = useGlobalStore();

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

    const startQuiz = async () => {
        if (!selectedModule) return;
        setLoading(true);
        setError(null);
        try {
            // Mobile stub might fail, but let's try
            const q = await mockService.generateMock(selectedModule, 'PRACTICE');
            setQuestions(q);
            setAnswers({});
            setCurrentIdx(0);
            setScore(0);
            setMode('QUIZ');
        } catch (e: any) {
             setError("Simulation Failed: " + (e.message || "AI unavailable"));
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (optionIdx: number) => {
        const q = questions[currentIdx];
        setAnswers(prev => ({ ...prev, [q.id]: optionIdx }));
    };

    const nextQuestion = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        let correct = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) correct++;
        });
        setScore(correct);
        
        addMockAttempt({
            moduleId: selectedModule!,
            mode: 'PRACTICE',
            questions,
            answers,
            score: correct,
            total: questions.length,
            timeSpent: 0, // TODO
            completedAt: Date.now()
        });
        
        setMode('RESULT');
    };

    const reset = () => {
        setMode('SETUP');
        setQuestions([]);
        setAnswers({});
    };

    // --- RENDERERS ---

    if (mode === 'SETUP') {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>TACTICAL SIMULATION</Text>
                
                <Text style={styles.label}>SELECT MODULE</Text>
                <ScrollView style={styles.list}>
                    {modules.map(m => (
                        <TouchableOpacity 
                            key={m.id} 
                            style={[styles.option, selectedModule === m.id && styles.optionSelected]}
                            onPress={() => setSelectedModule(m.id)}
                        >
                            <Text style={[styles.optionText, selectedModule === m.id && styles.optionTextSelected]}>
                                {m.name}
                            </Text>
                            {selectedModule === m.id && <Feather name="check-circle" size={20} color="#000" />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {error && <Text style={styles.error}>{error}</Text>}

                <TouchableOpacity 
                    style={[styles.btn, !selectedModule && styles.btnDisabled]}
                    onPress={startQuiz}
                    disabled={!selectedModule || loading}
                >
                    {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>INITIATE SEQ</Text>}
                </TouchableOpacity>
            </View>
        );
    }

    if (mode === 'QUIZ') {
        const q = questions[currentIdx];
        const selected = answers[q.id];
        
        return (
             <View style={styles.container}>
                 <View style={styles.quizHeader}>
                     <Text style={styles.progress}>Q{currentIdx + 1} / {questions.length}</Text>
                     <TouchableOpacity onPress={reset}><Feather name="x" size={24} color="#64748b" /></TouchableOpacity>
                 </View>

                 <ScrollView contentContainerStyle={{paddingBottom: 100}}>
                    <Text style={styles.question}>{q.question}</Text>
                    {q.snippet && (
                        <View style={styles.snippet}>
                            <Text style={styles.code}>{q.snippet}</Text>
                        </View>
                    )}

                    <View style={styles.options}>
                        {q.options.map((opt, i) => (
                            <TouchableOpacity 
                                key={i}
                                style={[styles.choice, selected === i && styles.choiceSelected]}
                                onPress={() => handleAnswer(i)}
                            >
                                <View style={[styles.radio, selected === i && styles.radioSelected]} />
                                <Text style={styles.choiceText}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                 </ScrollView>

                 <TouchableOpacity style={styles.fab} onPress={nextQuestion}>
                     <Feather name="arrow-right" size={32} color="#000" />
                 </TouchableOpacity>
             </View>
        );
    }

    if (mode === 'RESULT') {
        return (
            <View style={styles.center}>
                <Feather name="award" size={64} color="#00f0ff" />
                <Text style={styles.scoreTitle}>SIMULATION COMPLETE</Text>
                <Text style={styles.score}>{score} / {questions.length}</Text>
                
                <TouchableOpacity style={styles.btn} onPress={reset}>
                    <Text style={styles.btnText}>RETURN TO BASE</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050510', padding: 20 },
    center: { flex: 1, backgroundColor: '#050510', alignItems: 'center', justifyContent: 'center', padding: 20 },
    header: { color: '#00f0ff', fontSize: 24, fontWeight: '900', marginBottom: 30, letterSpacing: 1 },
    label: { color: '#64748b', marginBottom: 10, fontSize: 12, letterSpacing: 2 },
    list: { flex: 1, marginBottom: 20 },
    option: {
        padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    optionSelected: { backgroundColor: '#00f0ff' },
    optionText: { color: '#cbd5e1', fontSize: 16 },
    optionTextSelected: { color: '#000', fontWeight: 'bold' },
    btn: {
        backgroundColor: '#00f0ff', padding: 18, borderRadius: 12, alignItems: 'center'
    },
    btnDisabled: { backgroundColor: '#1e293b' },
    btnText: { color: '#000', fontWeight: 'bold', letterSpacing: 1 },
    error: { color: '#ef4444', marginBottom: 20, textAlign: 'center' },
    
    // Quiz Styles
    quizHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    progress: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
    question: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, lineHeight: 28 },
    snippet: { backgroundColor: '#1e293b', padding: 16, borderRadius: 8, marginBottom: 20 },
    code: { color: '#a5b4fc', fontFamily: 'monospace' },
    options: { gap: 12 },
    choice: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
        borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
    },
    choiceSelected: { borderColor: '#00f0ff', backgroundColor: 'rgba(0, 240, 255, 0.1)' },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#64748b', marginRight: 12 },
    radioSelected: { borderColor: '#00f0ff', backgroundColor: '#00f0ff' },
    choiceText: { color: '#cbd5e1', fontSize: 16, flex: 1 },
    fab: {
        position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#00f0ff', alignItems: 'center', justifyContent: 'center', elevation: 5
    },

    // Result
    scoreTitle: { color: '#94a3b8', marginTop: 24, fontSize: 14, letterSpacing: 2 },
    score: { color: '#fff', fontSize: 48, fontWeight: '900', marginVertical: 20 }
});
