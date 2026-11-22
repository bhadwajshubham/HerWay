import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bike, CalendarDays, CarFront, Clock3, MapPin, Users, Wallet } from 'lucide-react-native';
import { PoolCreateSchema, type Pool } from '@herway/shared';
import { theme } from '../src/theme';
import { SpringPressable } from '../src/components/SpringPressable';
import { StickyBottomNavigation } from '../src/components/StickyBottomNavigation';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { FadeIn } from '../src/components/motion';
import { createPool, joinPool, subscribeOpenPools } from '../src/firebase/pools';
import { useIdentity } from '../src/firebase/useIdentity';
import {
  COMMUTE_DAYS,
  computeMonthlySplitInr,
  encodeCommutePoolNote,
  parseCommutePoolMeta,
  type CommuteDay,
  type PoolVehicleMode,
  type TodayCommuteStatus
} from '../src/domain/commutePool';

const HITEC = { lat: 17.4435, lng: 78.3772 };
const DESTINATION = { lat: 17.2403, lng: 78.4294 };

const LOGOUT_WINDOWS = ['5:30–6:00 PM', '6:15–6:45 PM', '7:30–8:00 PM'] as const;

const TODAY_STATUS_OPTIONS: { id: TodayCommuteStatus; label: string }[] = [
  { id: 'riding', label: 'Riding' },
  { id: 'wfh', label: 'WFH today' },
  { id: 'delayed', label: '+15m delayed' }
];

export default function RideShareScreen() {
  const identity = useIdentity();
  const [pools, setPools] = useState<Pool[]>([]);
  const [vehicleMode, setVehicleMode] = useState<PoolVehicleMode>('carpool');
  const [filterMode, setFilterMode] = useState<'all' | PoolVehicleMode>('all');
  const [origin, setOrigin] = useState('Ayyappa Society, Madhapur');
  const [destination, setDestination] = useState('Mindspace IT Park');
  const [logoutWindow, setLogoutWindow] = useState<string>('6:15–6:45 PM');
  const [activeDays, setActiveDays] = useState<CommuteDay[]>([
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri'
  ]);
  const [fare, setFare] = useState('60');
  const [seats, setSeats] = useState('3');
  const [noteText, setNoteText] = useState('');
  const [todayByPool, setTodayByPool] = useState<Record<string, TodayCommuteStatus>>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeOpenPools(setPools, (error) => setStatus(error.message)), []);

  const handleSelectVehicleMode = (mode: PoolVehicleMode) => {
    setVehicleMode(mode);
    if (mode === 'scooty_pool') {
      setSeats('2');
      setFare('35');
    } else {
      setSeats('3');
      setFare('60');
    }
  };

  const toggleDay = (day: CommuteDay) => {
    setActiveDays((prev) => {
      if (prev.includes(day)) {
        return prev.length > 1 ? prev.filter((item) => item !== day) : prev;
      }
      return [...prev, day];
    });
  };

  const parsedFare = Math.max(0, Number(fare) || 0);
  const monthlyEstimate = computeMonthlySplitInr(parsedFare, activeDays.length);

  const onHost = useCallback(async () => {
    if (busy || !identity.ready) {
      setStatus('Sign in with Google to host a daily commute pool.');
      return;
    }
    const seatsNum = vehicleMode === 'scooty_pool' ? 2 : Number(seats);
    const encodedNote = encodeCommutePoolNote({
      vehicleMode,
      logoutWindow,
      activeDays,
      fareShareInr: Number(fare),
      noteText
    });

    const parsed = PoolCreateSchema.safeParse({
      origin: origin.trim(),
      destination: destination.trim(),
      originPoint: HITEC,
      destinationPoint: DESTINATION,
      departureAt: Date.now() + 30 * 60 * 1000,
      seatsTotal: seatsNum,
      fareShareInr: Number(fare),
      note: encodedNote
    });
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? 'Check your commute pool details.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      await createPool({ uid: identity.uid, displayName: identity.displayName }, parsed.data);
      setNoteText('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not post the commute pool.');
    } finally {
      setBusy(false);
    }
  }, [
    activeDays,
    busy,
    destination,
    fare,
    identity,
    logoutWindow,
    noteText,
    origin,
    seats,
    vehicleMode
  ]);

  const onJoin = useCallback(
    async (pool: Pool) => {
      if (!identity.ready) {
        setStatus('Sign in with Google to join a commute pool.');
        return;
      }
      setStatus('');
      try {
        await joinPool(pool.poolId, { uid: identity.uid, displayName: identity.displayName });
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Could not join the pool.');
      }
    },
    [identity]
  );

  const visiblePools = pools.filter((pool) => {
    if (filterMode === 'all') return true;
    return parseCommutePoolMeta(pool).vehicleMode === filterMode;
  });

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader badge="DAILY COMMUTE POOL" tone="teal" />

        <FadeIn delay={40}>
          <Text accessibilityRole="header" style={styles.title}>
            Daily commute pool
          </Text>
          <Text style={styles.subtitle}>
            Match by office corridor and logout window for carpool or scooty-pool cost sharing.
          </Text>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>HOST DAILY / MONTHLY POOL</Text>

            <View style={styles.modeRow}>
              <SpringPressable
                onPress={() => handleSelectVehicleMode('carpool')}
                accessibilityRole="button"
                accessibilityState={{ selected: vehicleMode === 'carpool' }}
                style={[styles.modeBtn, vehicleMode === 'carpool' && styles.modeBtnActive]}
              >
                <CarFront
                  size={17}
                  color={vehicleMode === 'carpool' ? theme.color.textOnAccent : theme.color.teal}
                />
                <Text
                  style={[styles.modeBtnText, vehicleMode === 'carpool' && styles.modeBtnTextActive]}
                >
                  Carpool (4W)
                </Text>
              </SpringPressable>

              <SpringPressable
                onPress={() => handleSelectVehicleMode('scooty_pool')}
                accessibilityRole="button"
                accessibilityState={{ selected: vehicleMode === 'scooty_pool' }}
                style={[styles.modeBtn, vehicleMode === 'scooty_pool' && styles.modeBtnActive]}
              >
                <Bike
                  size={17}
                  color={
                    vehicleMode === 'scooty_pool' ? theme.color.textOnAccent : theme.color.teal
                  }
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    vehicleMode === 'scooty_pool' && styles.modeBtnTextActive
                  ]}
                >
                  Scooty-pool (2W)
                </Text>
              </SpringPressable>
            </View>

            <Text style={styles.fieldLabel}>HOME / SOCIETY PICKUP</Text>
            <TextInput
              value={origin}
              onChangeText={setOrigin}
              placeholder="e.g. Ayyappa Society, Madhapur"
              placeholderTextColor={theme.color.muted}
              accessibilityLabel="Origin"
              style={styles.input}
            />

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>OFFICE / TECH PARK</Text>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g. Mindspace IT Park"
              placeholderTextColor={theme.color.muted}
              accessibilityLabel="Destination"
              style={styles.input}
            />

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>LOGIN / LOGOUT WINDOW</Text>
            <View style={styles.windowRow}>
              {LOGOUT_WINDOWS.map((slot) => {
                const selectedSlot = logoutWindow === slot;
                return (
                  <SpringPressable
                    key={slot}
                    onPress={() => setLogoutWindow(slot)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedSlot }}
                    style={[styles.windowChip, selectedSlot && styles.windowChipActive]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.windowText, selectedSlot && styles.windowTextActive]}
                    >
                      {slot}
                    </Text>
                  </SpringPressable>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, styles.spacedLabel]}>HYBRID WEEKDAYS</Text>
            <View style={styles.daysRow}>
              {COMMUTE_DAYS.map((day) => {
                const isOn = activeDays.includes(day);
                return (
                  <SpringPressable
                    key={day}
                    onPress={() => toggleDay(day)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isOn }}
                    style={[styles.dayChip, isOn && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayText, isOn && styles.dayTextActive]}>{day}</Text>
                  </SpringPressable>
                );
              })}
            </View>

            <View style={styles.divider} />

            <View style={styles.splitRow}>
              <View style={styles.splitField}>
                <Text style={styles.miniLabel}>SPLIT / RIDE (₹)</Text>
                <TextInput
                  value={fare}
                  onChangeText={setFare}
                  keyboardType="numeric"
                  placeholder="60"
                  placeholderTextColor={theme.color.muted}
                  accessibilityLabel="Fare per seat"
                  style={styles.splitInput}
                />
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.splitField}>
                <Text style={styles.miniLabel}>SEATS (2–4)</Text>
                <TextInput
                  value={vehicleMode === 'scooty_pool' ? '2' : seats}
                  onChangeText={setSeats}
                  editable={vehicleMode !== 'scooty_pool'}
                  keyboardType="numeric"
                  placeholder="3"
                  placeholderTextColor={theme.color.muted}
                  accessibilityLabel="Seats available"
                  style={[styles.splitInput, vehicleMode === 'scooty_pool' && styles.readOnlyInput]}
                />
              </View>
            </View>

            <View style={styles.monthlySummary}>
              <CalendarDays size={16} color={theme.color.teal} />
              <Text style={styles.monthlySummaryText}>
                Est. monthly split ({activeDays.length}d/wk × 4 wks):{' '}
                <Text style={styles.monthlyHighlight}>₹{monthlyEstimate}/mo</Text>
              </Text>
            </View>

            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              maxLength={140}
              placeholder="Optional pickup landmark (e.g. Gate 2 near metro)"
              placeholderTextColor={theme.color.muted}
              accessibilityLabel="Pickup landmark note"
              style={[styles.input, styles.noteInput]}
            />

            <SpringPressable
              onPress={() => void onHost()}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryCta, (pressed || busy) && styles.pressed]}
            >
              <Text style={styles.primaryCtaText}>
                {busy ? 'Publishing pool...' : 'Publish commute pool'}
              </Text>
            </SpringPressable>
          </View>
        </FadeIn>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Matched pools nearby</Text>
          <View style={styles.filterRow}>
            {(['all', 'carpool', 'scooty_pool'] as const).map((tab) => {
              const active = filterMode === tab;
              const label = tab === 'all' ? 'All' : tab === 'carpool' ? 'Car' : 'Scooty';
              return (
                <SpringPressable
                  key={tab}
                  onPress={() => setFilterMode(tab)}
                  accessibilityRole="button"
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {label}
                  </Text>
                </SpringPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.poolsList}>
          {visiblePools.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No open commute pools in this view yet. Post your shift schedule above.
              </Text>
            </View>
          ) : null}

          {visiblePools.map((pool, index) => {
            const meta = parseCommutePoolMeta(pool);
            const todayStatus = todayByPool[pool.poolId] ?? 'riding';

            return (
              <FadeIn key={pool.poolId} delay={index * 50}>
                <View style={styles.poolCard}>
                  <View style={styles.poolTopRow}>
                    <View style={styles.modeTag}>
                      {meta.vehicleMode === 'scooty_pool' ? (
                        <Bike size={13} color={theme.color.teal} />
                      ) : (
                        <CarFront size={13} color={theme.color.teal} />
                      )}
                      <Text style={styles.modeTagText}>
                        {meta.vehicleMode === 'scooty_pool' ? 'SCOOTY-POOL' : 'CARPOOL'}
                      </Text>
                    </View>
                    <Text style={styles.monthlyTag}>~₹{meta.monthlyEstimateInr}/mo</Text>
                  </View>

                  <Text style={styles.poolRoute}>
                    {pool.origin} → {pool.destination}
                  </Text>

                  <View style={styles.scheduleMetaRow}>
                    <Clock3 size={14} color={theme.color.orange} />
                    <Text style={styles.scheduleMetaText}>
                      {meta.logoutWindow} · {meta.activeDays.join(', ')}
                    </Text>
                  </View>

                  {meta.noteText ? (
                    <Text style={styles.poolNoteText} numberOfLines={2}>
                      {meta.noteText}
                    </Text>
                  ) : null}

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Users size={14} color={theme.color.teal} />
                      <Text style={styles.metaText}>
                        {pool.members.length}/{pool.seatsTotal} seats
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Wallet size={14} color={theme.color.orange} />
                      <Text style={styles.metaText}>₹{pool.fareShareInr}/ride</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MapPin size={14} color={theme.color.teal} />
                      <Text numberOfLines={1} style={styles.metaText}>
                        {pool.hostName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.todayRow}>
                    <Text style={styles.todayLabel}>Today:</Text>
                    {TODAY_STATUS_OPTIONS.map((opt) => {
                      const active = todayStatus === opt.id;
                      return (
                        <SpringPressable
                          key={opt.id}
                          onPress={() =>
                            setTodayByPool((prev) => ({ ...prev, [pool.poolId]: opt.id }))
                          }
                          accessibilityRole="button"
                          style={[styles.todayChip, active && styles.todayChipActive]}
                        >
                          <Text style={[styles.todayChipText, active && styles.todayChipTextActive]}>
                            {opt.label}
                          </Text>
                        </SpringPressable>
                      );
                    })}
                  </View>

                  <SpringPressable
                    onPress={() => void onJoin(pool)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.joinBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.joinBtnText}>Join monthly pool</Text>
                  </SpringPressable>
                </View>
              </FadeIn>
            );
          })}
        </View>

        {status ? (
          <Text accessibilityRole="alert" style={styles.statusError}>
            {status}
          </Text>
        ) : null}
      </ScrollView>
      <StickyBottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.surface
  },
  scroll: {
    width: '100%'
  },
  content: {
    width: '100%',
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 112
  },
  title: {
    color: theme.color.white,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: theme.font.bold,
    marginTop: 20
  },
  subtitle: {
    color: theme.color.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.font.regular,
    marginTop: 6
  },
  card: {
    marginTop: 18,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    padding: 16
  },
  cardEyebrow: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.bold,
    letterSpacing: 0.5,
    marginBottom: 12
  },
  modeRow: {
    flexDirection: 'row',
    gap: theme.layout.cardGap,
    marginBottom: 16
  },
  modeBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10
  },
  modeBtnActive: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.teal
  },
  modeBtnText: {
    color: theme.color.white,
    fontSize: 13,
    fontFamily: theme.font.bold
  },
  modeBtnTextActive: {
    color: theme.color.textOnAccent
  },
  fieldLabel: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.bold,
    letterSpacing: 0.4
  },
  spacedLabel: {
    marginTop: 14
  },
  input: {
    color: theme.color.white,
    minHeight: 44,
    fontSize: 14,
    fontFamily: theme.font.semibold,
    paddingVertical: 6
  },
  noteInput: {
    marginTop: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    paddingHorizontal: 12
  },
  divider: {
    height: 1,
    backgroundColor: theme.color.border,
    marginVertical: 10
  },
  windowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  windowChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface
  },
  windowChipActive: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft
  },
  windowText: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.semibold
  },
  windowTextActive: {
    color: theme.color.teal,
    fontFamily: theme.font.bold
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8
  },
  dayChip: {
    flex: 1,
    minHeight: 36,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayChipActive: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft
  },
  dayText: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.semibold
  },
  dayTextActive: {
    color: theme.color.teal,
    fontFamily: theme.font.bold
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  splitField: {
    flex: 1
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.color.border,
    marginHorizontal: 12
  },
  miniLabel: {
    color: theme.color.muted,
    fontSize: 10,
    fontFamily: theme.font.bold,
    letterSpacing: 0.4
  },
  splitInput: {
    color: theme.color.white,
    minHeight: 40,
    fontSize: 16,
    fontFamily: theme.font.bold
  },
  readOnlyInput: {
    color: theme.color.muted
  },
  monthlySummary: {
    marginTop: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  monthlySummaryText: {
    flex: 1,
    color: theme.color.white,
    fontSize: 12,
    fontFamily: theme.font.regular
  },
  monthlyHighlight: {
    color: theme.color.teal,
    fontFamily: theme.font.bold
  },
  primaryCta: {
    marginTop: 14,
    minHeight: 50,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.teal,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryCtaText: {
    color: theme.color.textOnAccent,
    fontSize: 15,
    fontFamily: theme.font.bold
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
    gap: 8
  },
  sectionTitle: {
    color: theme.color.white,
    fontSize: 18,
    fontFamily: theme.font.bold
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised
  },
  filterPillActive: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft
  },
  filterText: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.semibold
  },
  filterTextActive: {
    color: theme.color.teal,
    fontFamily: theme.font.bold
  },
  poolsList: {
    gap: theme.layout.cardGap
  },
  emptyCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    color: theme.color.muted,
    fontSize: 14,
    fontFamily: theme.font.regular,
    textAlign: 'center'
  },
  poolCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surfaceRaised,
    padding: 16
  },
  poolTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.tealSoft
  },
  modeTagText: {
    color: theme.color.teal,
    fontSize: 10,
    fontFamily: theme.font.bold,
    letterSpacing: 0.4
  },
  monthlyTag: {
    color: theme.color.white,
    fontSize: 13,
    fontFamily: theme.font.bold
  },
  poolRoute: {
    color: theme.color.white,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: theme.font.bold
  },
  scheduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8
  },
  scheduleMetaText: {
    color: theme.color.orange,
    fontSize: 12,
    fontFamily: theme.font.semibold
  },
  poolNoteText: {
    color: theme.color.muted,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: theme.font.regular,
    marginTop: 6
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  metaText: {
    color: theme.color.muted,
    fontSize: 13,
    fontFamily: theme.font.regular
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.color.border
  },
  todayLabel: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.bold,
    marginRight: 2
  },
  todayChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface
  },
  todayChipActive: {
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft
  },
  todayChipText: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.semibold
  },
  todayChipTextActive: {
    color: theme.color.teal,
    fontFamily: theme.font.bold
  },
  joinBtn: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.teal,
    backgroundColor: theme.color.tealSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  joinBtnText: {
    color: theme.color.teal,
    fontSize: 14,
    fontFamily: theme.font.bold
  },
  statusError: {
    color: theme.color.danger,
    fontSize: 13,
    fontFamily: theme.font.semibold,
    marginTop: 14,
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.88
  }
});