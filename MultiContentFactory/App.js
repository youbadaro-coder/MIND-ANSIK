import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { 
  Provider as PaperProvider, 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title, 
  Paragraph, 
  FAB, 
  IconButton,
  MD3DarkTheme,
  Snackbar
} from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7e57c2', // Gemma 4 Deep Purple
    secondary: '#ffca28', // Gemma 4 Gold
    background: '#0a0a0a', // Deepest Black
    surface: '#121212',
    onSurface: '#e0e0e0',
  },
};

export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const generateContent = async () => {
    if (!input.trim()) {
      Alert.alert("[젬마 4] 알림", "글감을 먼저 입력해 주세요! 🫡🐟");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      console.log("Gemma 4 고지능 연산 중...");
      const response = await fetch('http://192.168.219.118:8001/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error('젬마 4 지능 연동에 실패했습니다!');
      }

      const data = await response.json();
      console.log("Gemma 4 지각 성공!");
      setResult(data);
    } catch (error) {
      console.error(error);
      Alert.alert("연결 요류", "PC의 젬마 4 서버가 응답하지 않습니다! 🫡🐟🔧");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    setSnackbarMessage("젬마 4의 지혜가 복사되었습니다! 📋✨");
    setSnackbarVisible(true);
  };

  const showDetails = (title, content) => {
    Alert.alert(`💎 [젬마 4] ${title}`, content, [{ text: "확인" }]);
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <IconButton icon="brain" size={48} iconColor="#7e57c2" />
              <Title style={styles.headerTitle}>Gemma 4 Factory</Title>
              <Text style={styles.headerSubtitle}>PREMIUM AI INTELLIGENCE</Text>
              <View style={styles.intelBadge}>
                <Text style={styles.intelText}>GEMMA 4 INTEL ACTIVE</Text>
              </View>
            </View>

            <Card style={styles.inputCard}>
              <Card.Content>
                <TextInput
                  label="폭발적인 아이디어를 입력하세요"
                  value={input}
                  onChangeText={setInput}
                  mode="flat"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                  textColor="#fff"
                  placeholderTextColor="#888"
                  activeUnderlineColor="#7e57c2"
                />
                <Button 
                  mode="contained" 
                  onPress={generateContent} 
                  loading={loading}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  buttonColor="#7e57c2"
                  textColor="#fff"
                >
                  Gemma 4 연금술 기동!
                </Button>
              </Card.Content>
            </Card>

            {result && (
              <View style={styles.resultContainer}>
                <Text style={styles.sectionTitle}>🏆 GEMMA 4 분석 결과</Text>
                
                <ContentCard 
                  title="유튜브 마케팅 전략" 
                  content={result.youtube} 
                  icon="television-play" 
                  color="#ff5252" 
                  onCopy={() => copyToClipboard(result.youtube)}
                  onDetail={() => showDetails("마케팅 전략", result.youtube)}
                />
                <ContentCard 
                  title="쇼츠/스토리 대본" 
                  content={result.shorts} 
                  icon="lightning-bolt" 
                  color="#ffd740" 
                  onCopy={() => copyToClipboard(result.shorts)}
                  onDetail={() => showDetails("콘텐츠 대본", result.shorts)}
                />
                <ContentCard 
                  title="SNS 페르소나 포스트" 
                  content={result.sns} 
                  icon="account-group" 
                  color="#40c4ff" 
                  onCopy={() => copyToClipboard(result.sns)}
                  onDetail={() => showDetails("SNS 포스트", result.sns)}
                />
                <ContentCard 
                  title="인사이트 소식지" 
                  content={result.newsletter} 
                  icon="file-certificate" 
                  color="#ff80ab" 
                  onCopy={() => copyToClipboard(result.newsletter)}
                  onDetail={() => showDetails("뉴스레터", result.newsletter)}
                />
              </View>
            )}
          </ScrollView>

          <FAB
            icon="refresh"
            style={styles.fab}
            onPress={() => setInput('')}
            label="신규 기획"
            color="#000"
          />

          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            style={styles.snackbar}
            action={{
              label: '닫기',
              onPress: () => setSnackbarVisible(false),
            }}>
            {snackbarMessage}
          </Snackbar>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function ContentCard({ title, content, icon, color, onCopy, onDetail }) {
  return (
    <Card style={styles.resultCard}>
      <Card.Title 
        title={title} 
        titleStyle={styles.cardTitle}
        left={(props) => <IconButton {...props} icon={icon} iconColor={color} />}
      />
      <Card.Content>
        <Paragraph style={styles.paragraph} numberOfLines={3}>{content}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button textColor={color} onPress={onCopy}>복사</Button>
        <Button textColor="#999" onPress={onDetail}>더보기</Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#7e57c2',
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#666',
    fontSize: 12,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 5,
  },
  intelBadge: {
    backgroundColor: 'rgba(126, 87, 194, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(126, 87, 194, 0.3)',
  },
  intelText: {
    color: '#7e57c2',
    fontSize: 10,
    fontWeight: 'bold',
  },
  inputCard: {
    backgroundColor: '#161616',
    elevation: 0,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#222',
    paddingVertical: 10,
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  button: {
    borderRadius: 15,
    elevation: 5,
  },
  buttonContent: {
    height: 55,
  },
  resultContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7e57c2',
    marginBottom: 20,
    marginLeft: 5,
    letterSpacing: 1,
  },
  resultCard: {
    backgroundColor: '#161616',
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paragraph: {
    color: '#aaa',
    lineHeight: 24,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffca28',
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 10,
  },
});
