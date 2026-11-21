import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';
import { theme } from '../theme';

interface StatusMessageProps {
  kind: 'loading' | 'error' | 'empty';
  title: string;
  detail?: string;
}

export function StatusMessage({ kind, title, detail }: StatusMessageProps) {
  const Icon = kind === 'error' ? AlertCircle : kind === 'empty' ? Inbox : LoaderCircle;
  return (
    <View
      accessibilityRole={kind === 'error' ? 'alert' : 'text'}
      style={{
        minHeight: 72,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: kind === 'error' ? '#6B3A36' : theme.color.borderDark,
        backgroundColor: theme.color.surfaceDarkRaised,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        marginTop: 10
      }}
    >
      {kind === 'loading' ? (
        <ActivityIndicator color={theme.color.teal} accessibilityLabel={title} />
      ) : (
        <Icon size={20} color={kind === 'error' ? '#FFC5BD' : theme.color.teal} />
      )}
      <View style={{ flex: 1, marginLeft: 11 }}>
        <Text
          style={{
            color: theme.color.white,
            fontSize: 14,
            fontFamily: theme.font.bold
          }}
        >
          {title}
        </Text>
        {detail ? (
          <Text
            style={{
              color: '#A7A7AD',
              fontSize: 12,
              lineHeight: 18,
              marginTop: 3,
              fontFamily: theme.font.regular
            }}
          >
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
