import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/app_config.dart';
import 'core/main_scaffold.dart';
import 'features/auth/login_screen.dart';
import 'features/demo/demo_shell.dart';
import 'firebase_options.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  ErrorWidget.builder = (details) => const _UnexpectedErrorScreen();
  runApp(const ProviderScope(child: HerWayApp()));
}

class HerWayApp extends ConsumerWidget {
  const HerWayApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeNotifierProvider);

    return MaterialApp(
      title: 'HerWay',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme(),
      darkTheme: AppTheme.darkTheme(),
      themeMode: themeMode,
      onGenerateInitialRoutes: (initialRoute) => [
        _routeFor(RouteSettings(name: initialRoute)),
      ],
      onGenerateRoute: _routeFor,
    );
  }

  Route<dynamic> _routeFor(RouteSettings settings) {
    final path = settings.name ?? '/';
    return MaterialPageRoute<void>(
      settings: settings,
      builder: (_) => path == '/' || path.isEmpty
          ? const FirebaseBootstrap()
          : NotFoundScreen(path: path),
    );
  }
}

class FirebaseBootstrap extends StatefulWidget {
  const FirebaseBootstrap({super.key});

  @override
  State<FirebaseBootstrap> createState() => _FirebaseBootstrapState();
}

class _FirebaseBootstrapState extends State<FirebaseBootstrap> {
  late Future<void> _initialization;

  @override
  void initState() {
    super.initState();
    _initialization = _initializeFirebase();
  }

  Future<void> _initializeFirebase() async {
    if (AppConfig.isDemoMode) return;
    AppConfig.validateFirebase();
    if (Firebase.apps.isNotEmpty) return;

    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    ).timeout(const Duration(seconds: 20));
  }

  void _retry() {
    setState(() => _initialization = _initializeFirebase());
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _initialization,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _LoadingScreen();
        }
        if (snapshot.hasError) {
          return _StartupErrorScreen(error: snapshot.error!, onRetry: _retry);
        }
        if (AppConfig.isDemoMode) return const DemoShell();
        return const AuthWrapper();
      },
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const _LoadingScreen(message: 'Checking your secure session…');
        }
        if (snapshot.hasError) {
          return _StartupErrorScreen(
            error: snapshot.error!,
            onRetry: () => Navigator.pushReplacement(
              context,
              MaterialPageRoute<void>(
                builder: (_) => const FirebaseBootstrap(),
              ),
            ),
          );
        }
        return snapshot.hasData ? const MainScaffold() : const LoginScreen();
      },
    );
  }
}

class NotFoundScreen extends StatelessWidget {
  const NotFoundScreen({super.key, required this.path});

  final String path;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                '404',
                style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text('That page does not exist.'),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () => Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/',
                  (route) => false,
                ),
                child: const Text('Go to HerWay'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen({this.message = 'Loading HerWay…'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Color(0xFFFF6A00)),
            const SizedBox(height: 16),
            Text(message),
          ],
        ),
      ),
    );
  }
}

class _StartupErrorScreen extends StatelessWidget {
  const _StartupErrorScreen({required this.error, required this.onRetry});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final isConfigurationError = error is AppConfigurationException;
    final isTimeout = error is TimeoutException;
    final title = isConfigurationError
        ? 'Configuration needed'
        : isTimeout
        ? 'Connection timed out'
        : 'HerWay is unavailable';
    final message = isConfigurationError
        ? 'This preview is missing required environment variables. Add them in Vercel and redeploy.'
        : isTimeout
        ? 'The service took too long to respond. Check your connection and try again.'
        : 'Check your internet connection and try again. If this continues, the preview may be temporarily unavailable.';

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.cloud_off_outlined,
                size: 52,
                color: Color(0xFFFF6A00),
              ),
              const SizedBox(height: 16),
              Text(title, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 20),
              FilledButton(onPressed: onRetry, child: const Text('Try again')),
            ],
          ),
        ),
      ),
    );
  }
}

class _UnexpectedErrorScreen extends StatelessWidget {
  const _UnexpectedErrorScreen();

  @override
  Widget build(BuildContext context) {
    return const Material(
      child: Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Something went wrong. Please refresh the page and try again.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
