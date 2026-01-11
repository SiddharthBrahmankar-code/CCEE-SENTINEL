
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { chatService } from '../services/chatService';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export const ChatScreen = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', role: 'assistant', content: 'Greetings, Operator. I am the CCEE Sentinel. How can I assist with your preparation today?' }
    ]);
    const scrollRef = useRef<ScrollView>(null);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Scroll to bottom
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            // Prepare history for API (last 5 messages)
            const history = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));
            const res = await chatService.sendMessage(userMsg.content, history);
            
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.response };
            setMessages(prev => [...prev, aiMsg]);
        } catch (e: any) {
            const errMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: "Error: " + e.message };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>MENTOR AI</Text>
                <View style={styles.onlineBadge}>
                    <View style={styles.dot} />
                    <Text style={styles.onlineText}>ONLINE</Text>
                </View>
            </View>

            <ScrollView 
                ref={scrollRef} 
                style={styles.chatArea} 
                contentContainerStyle={styles.chatContent}
            >
                {messages.map(msg => (
                    <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                        <Text style={styles.msgText}>{msg.content}</Text>
                    </View>
                ))}
                {loading && (
                    <View style={styles.aiBubble}>
                        <ActivityIndicator color="#00f0ff" size="small" />
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputArea}>
                <TextInput 
                    style={styles.input} 
                    placeholder="Type a query..." 
                    placeholderTextColor="#64748b"
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
                    <Feather name="send" size={20} color="#000" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050510' },
    header: {
        height: 60,
        backgroundColor: '#0a0a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerTitle: { color: '#00f0ff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e', marginRight: 6 },
    onlineText: { color: '#22c55e', fontSize: 10, fontWeight: 'bold' },

    chatArea: { flex: 1 },
    chatContent: { padding: 16, paddingBottom: 20 },
    
    bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
    userBubble: { backgroundColor: '#00f0ff', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: '#1e293b', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
    
    msgText: { color: '#fff', fontSize: 15, lineHeight: 22 },

    inputArea: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#0a0a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#1e293b',
        color: '#fff',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#00f0ff',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
