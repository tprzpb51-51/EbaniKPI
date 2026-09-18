import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import MapView, { Circle, Marker } from './src/mapComponents';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL || 'https://tprz-pb-51.onrender.com';
const API_URL = `${SERVER_URL}/api`;
const THEMES = {
  прогулянка: { label: 'Прогулянка', subtypes: ['Пробіжка', 'Нове знайомство', 'Вечірня прогулянка'] },
  ігри: { label: 'Настільні ігри', subtypes: ['Настільні ігри в клубі', 'Настільні ігри вдома'] },
  вечірка: { label: 'Вечірка', subtypes: ['Випити в хорошій компанії', 'Вечірка без алкоголю', '18+'] },
  інтерактиви: { label: 'Інтерактиви', subtypes: ['Футбол', 'Баскетбол', 'Страйкбол', 'Рибалка'] },
};
const TIME_SLOTS = ['12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

const getNextDays = () => Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return {
    date,
    label: index === 0 ? 'Сьогодні' : index === 1 ? 'Завтра' : date.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric' }),
  };
});

const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#17172A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1F2A44',
  },
  authWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#17172A',
  },
  authCard: {
    backgroundColor: '#25253F',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4F857',
    textAlign: 'center',
    marginBottom: 18,
  },
  input: {
    backgroundColor: '#17172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 12,
  },
  phonePrefix: {
    paddingHorizontal: 14,
    color: '#A8A8C0',
    fontSize: 16,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#FF5A7A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryText: {
    textAlign: 'center',
    color: '#A8A8C0',
    fontWeight: '600',
    marginTop: 6,
  },
  authHero: {
    marginBottom: 18,
  },
  authEyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4F857',
    color: '#17172A',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '800',
  },
  authLogo: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '900',
    marginTop: 18,
    letterSpacing: -2,
  },
  authSubtitle: {
    color: '#D4F857',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  authIconRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 2,
  },
  authIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -5,
    borderWidth: 2,
    borderColor: '#17172A',
  },
  authTabs: {
    flexDirection: 'row',
    backgroundColor: '#17172A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  authTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 9,
  },
  authTabLogin: {
    backgroundColor: '#FF5A7A',
  },
  authTabRegister: {
    backgroundColor: '#D4F857',
  },
  authTabText: {
    color: '#8C8CA5',
    fontWeight: '800',
    fontSize: 14,
  },
  authTabActiveText: {
    color: '#FFFFFF',
  },
  authTabRegisterText: {
    color: '#17172A',
  },
  authHint: {
    color: '#85859E',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  authError: {
    color: '#FF7A96',
    backgroundColor: 'rgba(255,90,122,0.12)',
    borderRadius: 9,
    padding: 10,
    fontSize: 13,
    marginBottom: 4,
  },
  homeContainer: {
    flex: 1,
    backgroundColor: '#17172A',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoutText: {
    color: '#5B4BFF',
    fontWeight: '700',
    fontSize: 14,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#EEF0FF',
  },
  tabText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#69778D',
  },
  activeTabText: {
    color: '#4B47D6',
  },
  welcomeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 14,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#69778D',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 10,
    marginTop: 8,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 4,
  },
  metaText: {
    color: '#5F6B7C',
    fontSize: 13,
    marginBottom: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF0FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  badgeText: {
    color: '#4B47D6',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#5F6B7C',
    fontSize: 14,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#17172A',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#A8A8C0',
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
    minWidth: 0,
  },
  ageField: {
    flex: 0.72,
  },
  genderField: {
    flex: 1.28,
  },
  customMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF5A7A',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  customMarkerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  formButton: {
    backgroundColor: '#5B4BFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  formButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  profileCard: {
    backgroundColor: '#17172A',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarWrap: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#25253F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#D4F857',
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    fontSize: 42,
    color: '#D4F857',
    fontWeight: '900',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  avatarButton: {
    flex: 1,
    backgroundColor: '#FF5A7A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  avatarButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  screenScroll: {
    flex: 1,
  },
  chatScreen: {
    flex: 1,
    backgroundColor: '#17172A',
  },
  chatHeaderCard: {
    backgroundColor: '#202039',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    marginBottom: 10,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatEventIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,90,122,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  chatEventTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  chatEventMeta: {
    color: '#A8A8C0',
    fontSize: 12,
    marginTop: 3,
  },
  chatBackButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#2B2854',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBackButtonText: {
    color: '#D4F857',
    fontSize: 21,
    fontWeight: '800',
  },
  participantPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  participantAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D4F857',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  participantAvatarText: {
    color: '#17172A',
    fontSize: 13,
    fontWeight: '900',
  },
  participantName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  blockParticipantButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,90,122,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockParticipantText: {
    color: '#FF7A96',
    fontSize: 18,
    fontWeight: '900',
  },
  participantMenu: {
    backgroundColor: '#2B2854',
    borderRadius: 12,
    padding: 8,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,249,87,0.18)',
  },
  participantMenuAction: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  participantMenuActionText: {
    color: '#FF7A96',
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#5B4BFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#2B2854',
  },
  dangerButton: {
    backgroundColor: '#FFF0F0',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButtonText: {
    color: '#D4F857',
  },
  dangerButtonText: {
    color: '#C43D3D',
  },
  selectedEventCard: {
    backgroundColor: '#202039',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    marginBottom: 14,
  },
  messageList: {
    flex: 1,
    marginBottom: 10,
  },
  messageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#25253F',
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    maxWidth: '82%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#5B4BFF',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 5,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#D4F857',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  messageAuthor: {
    color: '#A8A8C0',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 1,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    marginTop: 5,
    textAlign: 'right',
  },
  pinnedMessage: {
    borderWidth: 1,
    borderColor: 'rgba(212,249,87,0.55)',
  },
  pinnedLabel: {
    color: '#D4F857',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  pinnedStrip: {
    backgroundColor: 'rgba(32,32,57,0.86)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,249,87,0.22)',
    padding: 7,
    marginBottom: 10,
  },
  pinnedStripHeader: {
    color: '#D4F857',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 7,
  },
  pinnedItem: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  pinnedItemText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 15,
  },
  scrollBottomButton: {
    position: 'absolute',
    right: 10,
    bottom: 72,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(91,75,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  scrollBottomText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  messageActionMenu: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(32,32,57,0.96)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,249,87,0.28)',
    paddingHorizontal: 5,
    paddingVertical: 4,
    marginTop: 6,
  },
  messageActionButton: {
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  messageActionText: {
    color: '#D4F857',
    fontSize: 11,
    fontWeight: '800',
  },
  chatEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 46,
  },
  chatEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(212,249,87,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  chatComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 4,
  },
  chatInput: {
    flex: 1,
    marginBottom: 0,
  },
  compactButton: {
    backgroundColor: '#5B4BFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 22,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#25253F',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedChip: {
    backgroundColor: '#5B4BFF',
  },
  chipText: {
    color: '#D9D9E7',
    fontSize: 13,
    fontWeight: '700',
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
  mapCard: {
    flex: 1,
    minHeight: 320,
    height: 320,
    overflow: 'hidden',
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#17172A',
  },
  mapOnlyScreen: {
    flex: 1,
    position: 'relative',
  },
  mapOnlyCard: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#17172A',
  },
  mapOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 10,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  map: {
    flex: 1,
    height: 320,
    minHeight: 320,
    width: '100%',
    backgroundColor: '#17172A',
  },
  locationSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationSearchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF5A7A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButton: {
    backgroundColor: '#D4F857',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 10,
  },
  locationButtonText: {
    color: '#17172A',
    fontWeight: '800',
  },
  addressResults: {
    backgroundColor: '#25253F',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  addressResult: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  addressResultText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuGreeting: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D4F857',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF5A7A',
  },
  menuGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  menuPrimaryCard: {
    flex: 1,
    minHeight: 200,
    backgroundColor: '#FF5A7A',
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
  },
  menuSideColumn: {
    flex: 1,
    gap: 12,
  },
  menuSideCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
  },
  menuMapCard: {
    backgroundColor: '#D4F857',
  },
  menuMyCard: {
    backgroundColor: '#2B2854',
    borderWidth: 1,
    borderColor: 'rgba(212,249,87,0.28)',
  },
  menuIconTile: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23,23,42,0.14)',
  },
  menuIconTileDark: {
    backgroundColor: 'rgba(23,23,42,0.09)',
  },
  menuCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  menuCardArrow: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 22,
    fontWeight: '700',
  },
  menuCardDescription: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 17,
  },
  menuCardDescriptionDark: {
    color: 'rgba(255,255,255,0.58)',
  },
  myEventsHero: {
    backgroundColor: '#202039',
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(212,249,87,0.18)',
  },
  myEventsEyebrow: {
    color: '#D4F857',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 7,
  },
  myEventsTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginBottom: 5,
  },
  myEventsSubtitle: {
    color: '#A8A8C0',
    fontSize: 13,
    lineHeight: 19,
  },
  mySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 2,
  },
  mySectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  mySectionCount: {
    color: '#A8A8C0',
    fontSize: 12,
    fontWeight: '700',
  },
  myEventCard: {
    backgroundColor: '#25253F',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  myEventCardOrganizer: {
    borderColor: 'rgba(255,90,122,0.3)',
  },
  myEventsScreen: {
    flex: 1,
    backgroundColor: '#17172A',
  },
  myEventsHeader: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  myEventsBack: {
    color: '#D4F857',
    fontSize: 13,
    fontWeight: '800',
  },
  myEventTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  myEventIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(212,249,87,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  myEventIconOrganizer: {
    backgroundColor: 'rgba(255,90,122,0.14)',
  },
  myEventTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  myEventStatus: {
    color: '#D4F857',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  myEventStatusCancelled: {
    color: '#FF7A96',
  },
  myEventMeta: {
    color: '#A8A8C0',
    fontSize: 13,
    marginBottom: 5,
  },
  myEventComment: {
    color: '#D9D9E7',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  myEventActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  myEventChatButton: {
    flex: 1,
    backgroundColor: '#FF5A7A',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myEventChatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  myEventCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,90,122,0.1)',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,90,122,0.35)',
  },
  myEventCancelButtonText: {
    color: '#FF7A96',
    fontSize: 13,
    fontWeight: '800',
  },
  myEmptyState: {
    backgroundColor: '#202039',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  myEmptyStateText: {
    color: '#A8A8C0',
    fontSize: 13,
    textAlign: 'center',
  },
  ownerNotice: {
    backgroundColor: 'rgba(212,249,87,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,249,87,0.2)',
    padding: 12,
  },
  ownerNoticeText: {
    color: '#D4F857',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  menuIcon: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  menuDarkIcon: {
    color: '#17172A',
  },
  menuCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  menuCardSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    marginTop: 3,
  },
  menuDarkTitle: {
    color: '#17172A',
  },
  nearbyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202039',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 22,
  },
  nearbyIcon: {
    color: '#FF5A7A',
    fontSize: 22,
    marginRight: 12,
  },
  nearbyText: {
    color: '#A8A8C0',
    fontSize: 14,
    flex: 1,
  },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState({ joined: [], organized: [] });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participantMenuId, setParticipantMenuId] = useState(null);
  const [messageMenuId, setMessageMenuId] = useState(null);
  const [activePinnedId, setActivePinnedId] = useState(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [messageContentHeight, setMessageContentHeight] = useState(0);
  const messageListRef = useRef(null);
  const messageOffsets = useRef({});
  const [chatText, setChatText] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('чоловік');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState('login');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [passwordBotLink, setPasswordBotLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [showVerificationChoice, setShowVerificationChoice] = useState(false);
  const [verificationContext, setVerificationContext] = useState('register');
  const [isVerified, setIsVerified] = useState(false);
  const [authError, setAuthError] = useState('');
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  const [eventTheme, setEventTheme] = useState('');

  const userVerificationState = user?.phoneVerified ? 'Підтверджений' : 'Не верифікований';
  const userVerificationColor = user?.phoneVerified ? '#D4F857' : '#FF5A7A';

  const triggerAvatarPicker = () => {
    if (Platform.OS === 'web') {
      avatarInputRef.current?.click?.();
      return;
    }

    Alert.alert('Фото в мобільній версії', 'Для мобільного додатку завантаження фото буде додано окремим picker-ом після стабілізації збірки.');
  };
  const [eventSubtype, setEventSubtype] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [mapPosition, setMapPosition] = useState({ latitude: 49.8397, longitude: 24.0297 });
  const [mapEvents, setMapEvents] = useState([]);
  const [mapFilter, setMapFilter] = useState('всі');
  const [locationStatus, setLocationStatus] = useState('loading');
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');
  const [eventForm, setEventForm] = useState({
    type: 'вечірка',
    ageMin: '18',
    ageMax: '35',
    maxParticipants: '10',
    genderPreference: 'будь-хто',
    comment: 'Погуляємо разом',
    latitude: '49.8397',
    longitude: '24.0297',
    startTime: '2026-12-15T19:00:00',
  });
  const days = getNextDays();
  const visibleMapEvents = mapEvents.filter((event) => {
    if (mapFilter === 'всі') return true;
    const category = String(event.type || '').split(':')[0].trim().toLowerCase();
    return category === mapFilter.toLowerCase();
  });

  const handlePhoneChange = (value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('380')) digits = digits.slice(3);
    if (digits.startsWith('0')) digits = digits.slice(1);
    setPhone(digits.slice(0, 9));
  };

  const searchAddress = async () => {
    if (!addressQuery.trim()) return;
    try {
      setSearchingAddress(true);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(addressQuery)}&accept-language=uk&countrycodes=ua&limit=5`, {
        headers: { Accept: 'application/json' },
      });
      const data = await response.json();
      setAddressResults(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Пошук адреси', 'Не вдалося знайти адресу');
    } finally {
      setSearchingAddress(false);
    }
  };

  const normalizeMapPoint = (point) => {
    if (!point) return null;
    const latitude = Number(point.latitude ?? point.lat);
    const longitude = Number(point.longitude ?? point.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  };

  const selectAddress = (result) => {
    const nextPosition = normalizeMapPoint({ latitude: Number(result.lat), longitude: Number(result.lon) });
    if (!nextPosition) return;
    setMapPosition(nextPosition);
    setEventForm((currentForm) => ({ ...currentForm, latitude: String(nextPosition.latitude), longitude: String(nextPosition.longitude) }));
    setAddressQuery(result.display_name);
    setAddressResults([]);
  };

  const handleMapSelection = (nextPosition) => {
    const normalized = normalizeMapPoint(nextPosition);
    if (!normalized) return;
    setMapPosition(normalized);
    setEventForm((currentForm) => ({ ...currentForm, latitude: String(normalized.latitude), longitude: String(normalized.longitude) }));
  };

  const useCurrentLocation = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        const current = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve({ coords: { latitude: position.coords.latitude, longitude: position.coords.longitude } }),
            (error) => reject(error),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
          );
        });

        const nextPosition = { latitude: current.coords.latitude, longitude: current.coords.longitude };
        setMapPosition(nextPosition);
        setEventForm((currentForm) => ({ ...currentForm, latitude: String(nextPosition.latitude), longitude: String(nextPosition.longitude) }));
        setAddressQuery('Моє місцезнаходження');
        setLocationStatus('granted');
        return;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== 'granted') {
        Alert.alert('Геолокація', 'Дозволь доступ до місцезнаходження');
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextPosition = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setMapPosition(nextPosition);
      setEventForm((currentForm) => ({ ...currentForm, latitude: String(nextPosition.latitude), longitude: String(nextPosition.longitude) }));
      setAddressQuery('Моє місцезнаходження');
      setLocationStatus('granted');
    } catch (error) {
      Alert.alert('Геолокація', 'Не вдалося визначити місцезнаходження');
    }
  };

  const loadMapEvents = async (currentToken = token, position = mapPosition) => {
    if (!currentToken) return;
    try {
      const params = new URLSearchParams({
        lat: String(position.latitude),
        lng: String(position.longitude),
        radius: '15',
      });
      const response = await fetchWithTimeout(`${API_URL}/events?${params}`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await response.json();
      if (response.ok) setMapEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Карта', 'Не вдалося завантажити події поруч');
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        const current = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            reject,
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
          );
        });
        setMapPosition(current);
        setLocationStatus('granted');
        await loadMapEvents(token, current);
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationStatus('denied');
        await loadMapEvents(token);
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      const position = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setMapPosition(position);
      setLocationStatus('granted');
      await loadMapEvents(token, position);
    })().catch(async () => {
      setLocationStatus('denied');
      await loadMapEvents(token);
    });
  }, [token, mapFilter]);

  useEffect(() => {
    if (!showVerificationChoice || phone.length !== 9) return undefined;
    const timer = setInterval(async () => {
      try {
        const response = await fetchWithTimeout(`${API_URL}/auth/verification-status?phone=%2B380${phone}`);
        const data = await response.json();
        if (data.verified) {
          setIsVerified(true);
          setUser((currentUser) => currentUser ? { ...currentUser, phoneVerified: true } : currentUser);
          clearInterval(timer);
        }
      } catch (error) {
        console.log('Verification status error:', error);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [showVerificationChoice, phone]);

  const loadSession = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('ebanikpi_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      const response = await fetchWithTimeout(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });

      if (!response.ok) {
        await AsyncStorage.removeItem('ebanikpi_token');
        setIsLoading(false);
        return;
      }

      const userData = await response.json();
      if (!userData) {
        await AsyncStorage.removeItem('ebanikpi_token');
        setIsLoading(false);
        return;
      }
      setToken(savedToken);
      setUser(userData);
      setAvatarUrl(resolveAssetUrl(userData.avatarUrl) || '');
      setEditName(userData.name || '');
      setEditAge(String(userData.age || ''));
      await Promise.all([loadEvents(savedToken), loadMyEvents(savedToken)]);
    } catch (error) {
      console.log('Session load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async (currentToken) => {
    if (!currentToken) return;

    try {
      setLoadingEvents(true);
      const response = await fetchWithTimeout(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      const data = await response.json();
      if (response.ok) {
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.log('Events load error:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadMyEvents = async (currentToken = token) => {
    if (!currentToken) return;

    try {
      const response = await fetchWithTimeout(`${API_URL}/events/my`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMyEvents({ joined: data.joined || [], organized: data.organized || [] });
      }
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося завантажити твої події');
    }
  };

  const joinEvent = async (event) => {
    try {
      setLoadingDetails(true);
      const response = await fetchWithTimeout(`${API_URL}/events/${event.id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Не вдалося приєднатися', data.error || 'Спробуй ще раз');
        return;
      }
      Alert.alert('Готово', data.message || 'Ти приєднався до події');
      setSelectedEvent(null);
      await Promise.all([loadEvents(token), loadMyEvents(token)]);
    } catch (error) {
      Alert.alert('Помилка', 'Сервер недоступний');
    } finally {
      setLoadingDetails(false);
    }
  };

  const cancelEvent = async (event) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Скасувати цю подію? Учасники більше не зможуть приєднатися.')) {
        await performCancelEvent(event);
      }
      return;
    }

    Alert.alert(
      'Скасувати подію?',
      'Учасники більше не зможуть приєднатися до цієї події.',
      [
        { text: 'Залишити', style: 'cancel' },
        { text: 'Скасувати', style: 'destructive', onPress: () => performCancelEvent(event) },
      ]
    );
  };

  const performCancelEvent = async (event) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/events/${event.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Помилка', data.error || 'Не вдалося скасувати подію');
        return;
      }
      Alert.alert('Готово', data.message || 'Подію скасовано');
      setSelectedEvent(null);
      await Promise.all([loadEvents(token), loadMyEvents(token)]);
    } catch (error) {
      Alert.alert('Помилка', 'Сервер недоступний');
    }
  };

  const openChat = async (event) => {
    try {
      setSelectedEvent(event);
      setShowParticipants(false);
      setParticipantMenuId(null);
      setMessageMenuId(null);
      setLoadingDetails(true);
      const [messagesResponse, participantsResponse] = await Promise.all([
        fetchWithTimeout(`${API_URL}/messages/${event.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchWithTimeout(`${API_URL}/events/${event.id}/participants`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const response = messagesResponse;
      const data = await response.json();
      if (participantsResponse.ok) {
        setParticipants(await participantsResponse.json());
      } else {
        setParticipants([]);
      }
      if (response.ok) setMessages(Array.isArray(data) ? data : []);
      setActiveTab('chat');
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося завантажити чат');
    } finally {
      setLoadingDetails(false);
    }
  };

  const performBlockParticipant = async (participant) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/events/${selectedEvent.id}/block/${participant.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Помилка', data.error || 'Не вдалося заблокувати учасника');
        return;
      }
      setParticipants((current) => current.filter((item) => item.id !== participant.id));
      await refreshChat();
      Alert.alert('Готово', data.message || 'Учасника заблоковано');
    } catch (error) {
      Alert.alert('Помилка', 'Сервер недоступний');
    }
  };

  const togglePinnedMessage = async (message) => {
    if (!selectedEvent || selectedEvent.organizerId !== user?.id) return;
    try {
      const response = await fetchWithTimeout(`${API_URL}/messages/${selectedEvent.id}/${message.id}/pin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Помилка', data.error || 'Не вдалося змінити закріплення');
        return;
      }
      setMessages((current) => current.map((item) => item.id === data.message.id ? data.message : item));
      if (data.message.isPinned) {
        setActivePinnedId(data.message.id);
      } else if (activePinnedId === data.message.id) {
        setActivePinnedId(null);
      }
    } catch (error) {
      Alert.alert('Помилка', 'Сервер недоступний');
    }
  };

  const scrollToMessage = (messageId) => {
    const offset = messageOffsets.current[messageId];
    if (typeof offset === 'number') {
      messageListRef.current?.scrollTo({ y: Math.max(0, offset - 18), animated: true });
    }
  };

  const openPinnedMessage = () => {
    if (activePinnedIndex < 0) return;
    const activeMessage = pinnedMessages[activePinnedIndex];
    scrollToMessage(activeMessage.id);
    if (pinnedMessages.length > 1) {
      const nextMessage = pinnedMessages[(activePinnedIndex + 1) % pinnedMessages.length];
      setActivePinnedId(nextMessage.id);
    }
  };

  const scrollToBottom = () => {
    messageListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  };

  const blockParticipant = (participant) => {
    const message = `Заблокувати ${participant.name || 'цього учасника'} для цієї події?`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) performBlockParticipant(participant);
      return;
    }
    Alert.alert('Заблокувати учасника?', message, [
      { text: 'Скасувати', style: 'cancel' },
      { text: 'Заблокувати', style: 'destructive', onPress: () => performBlockParticipant(participant) },
    ]);
  };

  const refreshChat = async () => {
    if (!selectedEvent || !token) return;
    try {
      const response = await fetchWithTimeout(`${API_URL}/messages/${selectedEvent.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setMessages(await response.json());
    } catch (error) {
      console.log('Chat refresh error:', error);
    }
  };

  useEffect(() => {
    if (!selectedEvent || activeTab !== 'chat') return undefined;
    const timer = setInterval(refreshChat, 3000);
    return () => clearInterval(timer);
  }, [selectedEvent, activeTab, token]);

  const sendMessage = async () => {
    const text = chatText.trim();
    if (!text || !selectedEvent) return;

    try {
      const response = await fetchWithTimeout(`${API_URL}/messages/${selectedEvent.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Помилка', data.error || 'Не вдалося відправити повідомлення');
        return;
      }
      setChatText('');
      setMessages((current) => [...current, data.message]);
    } catch (error) {
      Alert.alert('Помилка', 'Сервер недоступний');
    }
  };

  const saveProfile = async () => {
    try {
      if (!editName.trim() || !editAge) {
        Alert.alert('Помилка', 'Вкажи ім’я та вік');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const [nameResponse, ageResponse] = await Promise.all([
        fetchWithTimeout(`${API_URL}/auth/name`, {
          method: 'PATCH', headers, body: JSON.stringify({ name: editName.trim() }),
        }),
        fetchWithTimeout(`${API_URL}/auth/age`, {
          method: 'PATCH', headers, body: JSON.stringify({ age: Number(editAge) }),
        }),
      ]);

      if (!nameResponse.ok || !ageResponse.ok) {
        const errorData = await (!nameResponse.ok ? nameResponse : ageResponse).json();
        Alert.alert('Помилка', errorData.error || 'Не вдалося зберегти профіль');
        return;
      }

      const meResponse = await fetchWithTimeout(`${API_URL}/auth/me`, { headers });
      const updatedUser = await meResponse.json();
      setUser(updatedUser);
      setAvatarUrl(resolveAssetUrl(updatedUser.avatarUrl) || '');
      Alert.alert('Готово', 'Профіль оновлено');
    } catch (error) {
      Alert.alert('Помилка', 'Сервер недоступний');
    }
  };

  const requestPasswordReset = async () => {
    setAuthError('');
    if (phone.length !== 9) {
      setAuthError('Введіть 9 цифр номера телефону');
      return;
    }
    try {
      setResetLoading(true);
      const response = await fetchWithTimeout(`${API_URL}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+380${phone}` }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || 'Не вдалося надіслати код');
        if (data.botLink) setPasswordBotLink(data.botLink);
        return;
      }
      setResetStep('confirm');
    } catch (error) {
      setAuthError('Не вдалося з’єднатися з сервером');
    } finally {
      setResetLoading(false);
    }
  };

  const confirmPasswordReset = async () => {
    setAuthError('');
    if (resetCode.length !== 6) {
      setAuthError('Введіть 6-значний код із Telegram');
      return;
    }
    if (resetPassword.length < 4) {
      setAuthError('Пароль має містити мінімум 4 символи');
      return;
    }
    try {
      setResetLoading(true);
      const response = await fetchWithTimeout(`${API_URL}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+380${phone}`, code: resetCode, password: resetPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || 'Не вдалося змінити пароль');
        return;
      }
      setResetStep('login');
      setResetCode('');
      setResetPassword('');
      setAuthError('Пароль змінено. Тепер увійдіть.');
    } catch (error) {
      setAuthError('Не вдалося з’єднатися з сервером');
    } finally {
      setResetLoading(false);
    }
  };

  const triggerVerification = async (context = 'register') => {
    const verificationPhone = user?.phone ? user.phone : `+380${phone}`;
    setVerificationContext(context);
    setShowVerificationChoice(true);
    setIsVerified(Boolean(user?.phoneVerified));

    try {
      const linkResponse = await fetchWithTimeout(`${API_URL}/auth/telegram-link`);
      const linkData = await linkResponse.json();
      setTelegramLink(linkData.link || '');
      if (context === 'create' && verificationPhone) {
        setPhone(verificationPhone.replace(/\D/g, '').replace(/^380/, '').slice(0, 9));
      }
    } catch (error) {
      console.log('Verification link error:', error);
    }
  };

  const handleAuth = async () => {
    try {
      setAuthError('');
      if (!phone || !password) {
        setAuthError('Введіть телефон і пароль');
        return;
      }

      if (phone.length !== 9) {
        setAuthError('Введіть 9 цифр номера телефону після +380');
        return;
      }

      if (authMode === 'register') {
        if (!name || !age) {
          setAuthError('Заповніть ім’я і вік');
          return;
        }
        if (Number(age) < 1 || Number(age) > 120) {
          setAuthError('Вік має бути від 1 до 120 років');
          return;
        }
        if (password.length < 4) {
          setAuthError('Пароль має містити мінімум 4 символи');
          return;
        }
        if (password !== confirmPassword) {
          setAuthError('Паролі не співпадають');
          return;
        }
      }

      const endpoint = authMode === 'login' ? 'auth/login' : 'auth/register';
      const payload = authMode === 'login'
        ? { phone: `+380${phone}`, password }
        : { phone: `+380${phone}`, password, name, age: Number(age), gender };

      const response = await fetchWithTimeout(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || 'Не вдалося виконати запит');
        return;
      }

      if (data.token) {
        await AsyncStorage.setItem('ebanikpi_token', data.token);
        setToken(data.token);

        const meResponse = await fetchWithTimeout(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });

        if (meResponse.ok) {
          const meData = await meResponse.json();
          setUser(meData);
          setAvatarUrl(resolveAssetUrl(meData.avatarUrl) || '');
          setEditName(meData.name || '');
          setEditAge(String(meData.age || ''));
          await Promise.all([loadEvents(data.token), loadMyEvents(data.token)]);
        }
      }

      if (authMode === 'register') {
        const linkResponse = await fetchWithTimeout(`${API_URL}/auth/telegram-link`);
        const linkData = await linkResponse.json();
        setTelegramLink(linkData.link || '');
        setVerificationContext('register');
        setShowVerificationChoice(true);
        setAuthMode('login');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setAge('');
      }
    } catch (error) {
      console.log('Auth error:', error);
      setAuthError('Не вдалося з’єднатися з сервером');
    }
  };

  const resolveAssetUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${SERVER_URL}${url}`;
  };

  const handleAvatarUpload = async (file) => {
    if (!file || !token) return;
    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetchWithTimeout(`${API_URL}/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Помилка', data.error || 'Не вдалося завантажити фото');
        return;
      }

      const nextAvatarUrl = resolveAssetUrl(data.avatarUrl);
      setUser((current) => ({ ...current, avatarUrl: data.avatarUrl }));
      setAvatarUrl(nextAvatarUrl || '');
      Alert.alert('Готово', 'Фото профілю оновлено');
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося завантажити фото');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const goToMainMenu = () => {
    setActiveTab('menu');
  };

  const goBackFromChat = () => {
    setSelectedEvent(null);
    setShowParticipants(false);
    setParticipantMenuId(null);
    setMessageMenuId(null);
    setActiveTab('my');
    loadMyEvents();
  };

  const handleLogout = async () => {
    setShowVerificationChoice(false);
    setVerificationContext('register');
    setIsVerified(false);
    setTelegramLink('');
    await AsyncStorage.removeItem('ebanikpi_token');
    setToken(null);
    setUser(null);
    setEvents([]);
    setActiveTab('menu');
  };

  const openCreateEvent = () => {
    if (!user?.phoneVerified) {
      triggerVerification('create');
      return;
    }
    setActiveTab('create');
  };

  const handleCreateEvent = async () => {
    try {
      if (!user?.phoneVerified) {
        triggerVerification('create');
        return;
      }
      if (!eventTheme || !eventSubtype) {
        Alert.alert('Помилка', 'Оберіть тему та формат події');
        return;
      }
      if (!selectedTime) {
        Alert.alert('Помилка', 'Оберіть час події');
        return;
      }

      const selectedDate = new Date(days[selectedDayIndex].date);
      const [hours, minutes] = selectedTime.split(':');
      selectedDate.setHours(Number(hours), Number(minutes), 0, 0);
      const subtypeLabel = eventSubtype === 'Свій варіант' ? eventForm.customSubtype?.trim() : eventSubtype;
      if (!subtypeLabel) {
        Alert.alert('Помилка', 'Опиши свій формат події');
        return;
      }
      const finalType = `${THEMES[eventTheme].label}: ${subtypeLabel}`;
      const payload = {
        ...eventForm,
        type: finalType,
        ageMin: Number(eventForm.ageMin),
        ageMax: Number(eventForm.ageMax),
        maxParticipants: Number(eventForm.maxParticipants),
        genderPreference: eventForm.genderPreference === 'будь-хто' ? 'будь-яка' : eventForm.genderPreference,
        latitude: mapPosition.latitude,
        longitude: mapPosition.longitude,
        startTime: selectedDate.toISOString(),
      };

      if (!payload.type || !payload.startTime || !payload.comment) {
        Alert.alert('Помилка', 'Заповніть всі обов’язкові поля');
        return;
      }

      const response = await fetchWithTimeout(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Помилка', data.error || 'Не вдалося створити подію');
        return;
      }

      Alert.alert('Успішно', 'Подію створено');
      setEventForm({
        type: 'вечірка',
        ageMin: '18',
        ageMax: '35',
        maxParticipants: '10',
        genderPreference: 'будь-хто',
        comment: 'Погуляємо разом',
        latitude: '49.8397',
        longitude: '24.0297',
        startTime: '2026-12-15T19:00:00',
      });
      setEventTheme('');
      setEventSubtype('');
      setSelectedTime('');
      setActiveTab('events');
      await Promise.all([loadEvents(token), loadMyEvents(token), loadMapEvents(token, mapPosition)]);
    } catch (error) {
      console.log('Create event error:', error);
      Alert.alert('Помилка', 'Не вдалося створити подію');
    }
  };

  const pinnedMessages = messages
    .filter((message) => message.isPinned)
    .sort((first, second) => {
      const firstTime = new Date(first.createdAt || 0).getTime();
      const secondTime = new Date(second.createdAt || 0).getTime();
      return firstTime - secondTime || Number(first.id) - Number(second.id);
    });
  const activePinnedIndex = pinnedMessages.length
    ? Math.max(0, pinnedMessages.findIndex((message) => message.id === activePinnedId))
    : -1;
  const activePinnedMessageId = activePinnedIndex >= 0 ? pinnedMessages[activePinnedIndex].id : null;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B4BFF" />
          <Text style={styles.loadingText}>Завантаження...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!token || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.authWrapper}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.authHero}>
              <Text style={styles.authEyebrow}>зустрічі щодня</Text>
              <Text style={styles.authLogo}>Разом<Text style={{ color: '#FF5A7A' }}>.</Text></Text>
              <Text style={styles.authSubtitle}>хтось поруч теж не хоче сидіти вдома</Text>
              <View style={styles.authIconRow}>
                <View style={[styles.authIcon, { backgroundColor: '#FF5A7A' }]}><Text style={{ color: '#FFF', fontSize: 20 }}>◡</Text></View>
                <View style={[styles.authIcon, { backgroundColor: '#D4F857' }]}><Text style={{ color: '#17172A', fontSize: 20 }}>↕</Text></View>
                <View style={[styles.authIcon, { backgroundColor: '#25253F' }]}><Text style={{ color: '#FFF', fontSize: 20 }}>▦</Text></View>
                <View style={[styles.authIcon, { backgroundColor: '#FF5A7A' }]}><Text style={{ color: '#FFF', fontSize: 20 }}>✣</Text></View>
              </View>
            </View>

            <View style={styles.authCard}>
              <View style={styles.authTabs}>
                <TouchableOpacity
                  style={[styles.authTab, authMode === 'login' && styles.authTabLogin]}
                  onPress={() => { setAuthMode('login'); setResetStep('login'); setAuthError(''); }}
                >
                  <Text style={[styles.authTabText, authMode === 'login' && styles.authTabActiveText]}>Вхід</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authTab, authMode === 'register' && styles.authTabRegister]}
                  onPress={() => { setAuthMode('register'); setResetStep('login'); setAuthError(''); }}
                >
                  <Text style={[styles.authTabText, authMode === 'register' && styles.authTabRegisterText]}>Реєстрація</Text>
                </TouchableOpacity>
              </View>

              {authMode === 'login' && resetStep === 'login' && (
                <>
                  <View style={styles.phoneRow}>
                    <Text style={styles.phonePrefix}>+380</Text>
                    <TextInput style={styles.phoneInput} placeholder="991234567" placeholderTextColor="#55556F" value={phone} onChangeText={handlePhoneChange} keyboardType="number-pad" maxLength={9} />
                  </View>
                  <View style={styles.phoneRow}>
                    <TextInput style={styles.phoneInput} placeholder="Пароль" placeholderTextColor="#55556F" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 12 }}><Text style={{ color: '#777790' }}>{showPassword ? 'Сховати' : 'Показати'}</Text></TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => { setResetStep('request'); setAuthError(''); }}><Text style={[styles.secondaryText, { textAlign: 'right', color: '#85859E' }]}>Забули пароль?</Text></TouchableOpacity>
                  {authError ? <Text style={styles.authError}>{authError}</Text> : null}
                  <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}><Text style={styles.primaryButtonText}>Погнали  →</Text></TouchableOpacity>
                </>
              )}

              {authMode === 'login' && resetStep === 'request' && (
                <>
                  <TouchableOpacity onPress={() => setResetStep('login')}><Text style={styles.authHint}>← Назад до входу</Text></TouchableOpacity>
                  <Text style={styles.authTitle}>Відновлення пароля</Text>
                  <Text style={styles.authHint}>Код для відновлення прийде у прив’язаний Telegram.</Text>
                  <View style={styles.phoneRow}><Text style={styles.phonePrefix}>+380</Text><TextInput style={styles.phoneInput} placeholder="991234567" placeholderTextColor="#55556F" value={phone} onChangeText={handlePhoneChange} keyboardType="number-pad" maxLength={9} /></View>
                  {passwordBotLink ? <TouchableOpacity onPress={() => Linking.openURL(passwordBotLink)}><Text style={{ color: '#D4F857', marginBottom: 10 }}>Відкрити password bot</Text></TouchableOpacity> : null}
                  {authError ? <Text style={styles.authError}>{authError}</Text> : null}
                  <TouchableOpacity style={styles.primaryButton} onPress={requestPasswordReset} disabled={resetLoading}><Text style={styles.primaryButtonText}>{resetLoading ? 'Надсилаємо...' : 'Надіслати код'}</Text></TouchableOpacity>
                </>
              )}

              {authMode === 'login' && resetStep === 'confirm' && (
                <>
                  <TouchableOpacity onPress={() => setResetStep('request')}><Text style={styles.authHint}>← Назад до номера</Text></TouchableOpacity>
                  <Text style={styles.authTitle}>Новий пароль</Text>
                  <TextInput style={styles.input} placeholder="Код із Telegram" placeholderTextColor="#55556F" value={resetCode} onChangeText={(value) => setResetCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} />
                  <TextInput style={styles.input} placeholder="Новий пароль" placeholderTextColor="#55556F" value={resetPassword} onChangeText={setResetPassword} secureTextEntry />
                  {authError ? <Text style={styles.authError}>{authError}</Text> : null}
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#D4F857' }]} onPress={confirmPasswordReset} disabled={resetLoading}><Text style={[styles.primaryButtonText, { color: '#17172A' }]}>{resetLoading ? 'Зберігаємо...' : 'Змінити пароль'}</Text></TouchableOpacity>
                </>
              )}

              {authMode === 'register' && (
                <>
                  <TextInput style={styles.input} placeholder="Ім’я" placeholderTextColor="#55556F" value={name} onChangeText={(value) => setName(value.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s-]/g, ''))} />
                  <View style={styles.fieldRow}><TextInput style={[styles.input, styles.halfInput, styles.ageField]} placeholder="Вік" placeholderTextColor="#55556F" value={age} onChangeText={(value) => setAge(value.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" /><View style={[styles.halfInput, styles.genderField]}><Text style={styles.authHint}>Стать</Text><View style={styles.chips}>{['чоловік', 'жінка'].map((option) => <TouchableOpacity key={option} style={[styles.chip, gender === option && styles.selectedChip]} onPress={() => setGender(option)}><Text style={[styles.chipText, gender === option && styles.selectedChipText]}>{option}</Text></TouchableOpacity>)}</View></View></View>
                  <View style={styles.phoneRow}><Text style={styles.phonePrefix}>+380</Text><TextInput style={styles.phoneInput} placeholder="991234567" placeholderTextColor="#55556F" value={phone} onChangeText={handlePhoneChange} keyboardType="number-pad" maxLength={9} /></View>
                  <TextInput style={styles.input} placeholder="Пароль" placeholderTextColor="#55556F" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                  <TextInput style={styles.input} placeholder="Підтвердіть пароль" placeholderTextColor="#55556F" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
                  {authError ? <Text style={styles.authError}>{authError}</Text> : null}
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#D4F857' }]} onPress={handleAuth}><Text style={[styles.primaryButtonText, { color: '#17172A' }]}>Приєднатись  →</Text></TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {showVerificationChoice && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(23,23,42,0.94)', justifyContent: 'center', padding: 18, zIndex: 20 }}>
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>{verificationContext === 'create' ? 'Щоб створювати події, потрібна верифікація' : 'Підтвердити акаунт?'}</Text>
            <Text style={styles.authHint}>{verificationContext === 'create'
              ? 'Верифікація через Telegram дозволить створювати власні івенти. Неверифіковані користувачі можуть тільки приєднуватися до подій.'
              : 'Відкрий Telegram-бот, поділись номером, а потім повернись сюди. Верифікація дозволить створювати власні події.'}
            </Text>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#D4F857' }]} onPress={() => telegramLink && Linking.openURL(telegramLink)} disabled={!telegramLink}>
              <Text style={[styles.primaryButtonText, { color: '#17172A' }]}>Верифікувати через Telegram</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: isVerified ? '#D4F857' : '#45455F' }]}
              onPress={() => {
                if (isVerified) {
                  setShowVerificationChoice(false);
                  if (verificationContext === 'create') setActiveTab('create');
                }
              }}
              disabled={!isVerified}
            >
              <Text style={[styles.primaryButtonText, { color: isVerified ? '#17172A' : '#9A9AAF' }]}>{isVerified ? 'Готово ✓' : 'Очікуємо підтвердження...'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setShowVerificationChoice(false);
              if (verificationContext === 'create') setActiveTab('menu');
            }}>
              <Text style={styles.secondaryText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.homeContainer}>
        {activeTab === 'menu' ? (
          <>
            <View style={styles.menuHeader}>
              <Text style={styles.menuGreeting}>Привіт, {user?.name || 'друже'}</Text>
              <TouchableOpacity style={styles.profileButton} onPress={() => setActiveTab('profile')}>
                <Text style={{ color: '#17172A', fontSize: 22 }}>♙</Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ backgroundColor: userVerificationColor, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#17172A', fontWeight: '800', fontSize: 12 }}>{userVerificationState}</Text>
              </View>
            </View>

            <View style={styles.menuGrid}>
              <TouchableOpacity style={styles.menuPrimaryCard} onPress={openCreateEvent}>
                <View style={styles.menuCardTop}>
                  <View style={styles.menuIconTile}><Text style={styles.menuIcon}>＋</Text></View>
                  <Text style={styles.menuCardArrow}>↗</Text>
                </View>
                <View>
                  <Text style={styles.menuCardTitle}>Створити</Text>
                  <Text style={styles.menuCardSubtitle}>свою подію</Text>
                  <Text style={styles.menuCardDescription}>Знайди людей для спільного вечора</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.menuSideColumn}>
                <TouchableOpacity style={[styles.menuSideCard, styles.menuMapCard]} onPress={() => setActiveTab('map')}>
                  <View style={styles.menuCardTop}>
                    <View style={[styles.menuIconTile, styles.menuIconTileDark]}><Text style={[styles.menuIcon, styles.menuDarkIcon]}>⌖</Text></View>
                    <Text style={[styles.menuCardArrow, { color: '#17172A' }]}>↗</Text>
                  </View>
                  <View>
                    <Text style={[styles.menuCardTitle, styles.menuDarkTitle]}>Карта подій</Text>
                    <Text style={[styles.menuCardDescription, { color: 'rgba(23,23,42,0.62)' }]}>Що відбувається поруч</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuSideCard, styles.menuMyCard]} onPress={() => { setActiveTab('my'); loadMyEvents(); }}>
                  <View style={styles.menuCardTop}>
                    <View style={styles.menuIconTile}><Text style={[styles.menuIcon, { color: '#D4F857' }]}>▦</Text></View>
                    <Text style={styles.menuCardArrow}>↗</Text>
                  </View>
                  <View>
                    <Text style={styles.menuCardTitle}>Мої події</Text>
                    <Text style={[styles.menuCardDescription, styles.menuCardDescriptionDark]}>Події, чати та зустрічі</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.nearbyBar} onPress={() => setActiveTab('map')}>
              <Text style={styles.nearbyIcon}>♨</Text>
              <Text style={styles.nearbyText}>{locationStatus === 'granted' ? `${mapEvents.length} подій поруч` : 'Перевіряємо, що поруч...'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={{ alignSelf: 'center' }}>
              <Text style={styles.logoutText}>⇥  Вийти з акаунта</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {activeTab !== 'menu' && activeTab !== 'my' && <View style={styles.header}>
          <TouchableOpacity onPress={activeTab === 'chat' ? goBackFromChat : goToMainMenu}>
            <Text style={styles.logoutText}>{activeTab === 'chat' ? '← Мої події' : '← Головна'}</Text>
          </TouchableOpacity>
          <Text style={styles.brand}>EbaniKPI</Text>
          <TouchableOpacity onPress={activeTab === 'chat' ? goBackFromChat : goToMainMenu}>
            <Text style={styles.logoutText}>{activeTab === 'chat' ? 'Мої події' : 'Назад'}</Text>
          </TouchableOpacity>
        </View>}

        {activeTab === 'events' && (
          <>
            <View style={styles.welcomeBox}>
              <Text style={styles.welcomeTitle}>Привіт, {user?.name || 'друже'} 👋</Text>
              <Text style={styles.welcomeSubtitle}>Тут будуть твої події та нові запрошення.</Text>
            </View>

            <Text style={styles.sectionTitle}>Ближні події</Text>

            {selectedEvent && (
              <View style={styles.selectedEventCard}>
                <Text style={styles.eventType}>{selectedEvent.type}</Text>
                <Text style={styles.metaText}>{selectedEvent.comment || 'Без опису'}</Text>
                <Text style={styles.metaText}>Вільних місць: {selectedEvent.seatsLeft ?? '—'}</Text>
                {selectedEvent.organizerId === user?.id ? (
                  <View style={styles.ownerNotice}>
                    <Text style={styles.ownerNoticeText}>Це твоя подія. Ти вже є її організатором.</Text>
                    <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => setSelectedEvent(null)}>
                      <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Закрити</Text>
                    </TouchableOpacity>
                  </View>
                ) : <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => joinEvent(selectedEvent)}>
                    <Text style={styles.actionButtonText}>{loadingDetails ? '...' : 'Приєднатись'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => setSelectedEvent(null)}>
                    <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Закрити</Text>
                  </TouchableOpacity>
                </View>}
              </View>
            )}

            {loadingEvents ? (
              <View style={styles.emptyState}><Text style={styles.emptyStateText}>Завантаження...</Text></View>
            ) : events.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Поки немає активних подій поблизу.</Text>
              </View>
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.eventCard} onPress={() => setSelectedEvent(item)}>
                    <Text style={styles.eventType}>{item.type}</Text>
                    <Text style={styles.metaText}>Організатор: {item.organizer?.name || 'Невідомо'}</Text>
                    <Text style={styles.metaText}>Учасників: {item.participantCount || 0} / {item.maxParticipants || 0}</Text>
                    <Text style={styles.metaText}>Вік: {item.ageMin}–{item.ageMax}</Text>
                    <Text style={styles.metaText}>Початок: {item.startTime ? new Date(item.startTime).toLocaleString() : 'Не вказано'}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.genderPreference === 'будь-яка' ? 'будь-хто' : (item.genderPreference || 'будь-хто')}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}

        {activeTab === 'map' && (
          <View style={styles.mapOnlyScreen}>
            <View style={styles.mapOnlyCard}>
              <MapView style={[styles.map, { height: '100%', minHeight: 0 }]} region={{ ...mapPosition, latitudeDelta: 0.12, longitudeDelta: 0.12 }} showsUserLocation={locationStatus === 'granted'}>
                <Circle center={mapPosition} radius={15000} fillColor="rgba(91,75,255,0.08)" strokeColor="#5B4BFF" />
                {visibleMapEvents.map((item) => (
                  <Marker key={item.id} coordinate={{ latitude: Number(item.latitude), longitude: Number(item.longitude) }} title={item.type} description={item.comment} onPress={() => setSelectedEvent(item)} />
                ))}
              </MapView>
            </View>
            {selectedEvent && (
              <View style={[styles.selectedEventCard, styles.mapOverlay]}>
                <Text style={styles.eventType}>Тема: {String(selectedEvent.type || '').split(':')[0].trim()}</Text>
                <Text style={styles.metaText}>Підтема: {String(selectedEvent.type || '').split(':').slice(1).join(':').trim() || 'Не вказано'}</Text>
                <Text style={styles.metaText}>Коментар: {selectedEvent.comment || 'Без опису'}</Text>
                <Text style={styles.metaText}>Вільних місць: {selectedEvent.seatsLeft ?? '—'}</Text>
                {selectedEvent.organizerId === user?.id ? (
                  <View style={styles.ownerNotice}>
                    <Text style={styles.ownerNoticeText}>Це твоя подія. Ти вже є її організатором.</Text>
                    <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => setSelectedEvent(null)}>
                      <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Закрити</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => joinEvent(selectedEvent)}>
                      <Text style={styles.actionButtonText}>{loadingDetails ? '...' : 'Приєднатись'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => setSelectedEvent(null)}>
                      <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Закрити</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'create' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Створити подію</Text>

              <Text style={styles.label}>Тема</Text>
              <View style={styles.chips}>
                {Object.entries(THEMES).map(([key, theme]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.chip, eventTheme === key && styles.selectedChip]}
                    onPress={() => { setEventTheme(key); setEventSubtype(''); }}
                  >
                    <Text style={[styles.chipText, eventTheme === key && styles.selectedChipText]}>{theme.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {eventTheme && (
                <>
                  <Text style={styles.label}>Формат</Text>
                  <View style={styles.chips}>
                    {THEMES[eventTheme].subtypes.concat(['Свій варіант']).map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[styles.chip, eventSubtype === option && styles.selectedChip]}
                        onPress={() => setEventSubtype(option)}
                      >
                        <Text style={[styles.chipText, eventSubtype === option && styles.selectedChipText]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {eventSubtype === 'Свій варіант' && (
                    <TextInput
                      style={styles.input}
                      placeholder="Опиши свій формат"
                      onChangeText={(text) => setEventForm({ ...eventForm, customSubtype: text })}
                    />
                  )}
                </>
              )}

              <View style={styles.fieldRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Вік від</Text>
                  <TextInput
                    style={styles.input}
                    value={eventForm.ageMin}
                    keyboardType="numeric"
                    onChangeText={(text) => setEventForm({ ...eventForm, ageMin: text })}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Вік до</Text>
                  <TextInput
                    style={styles.input}
                    value={eventForm.ageMax}
                    keyboardType="numeric"
                    onChangeText={(text) => setEventForm({ ...eventForm, ageMax: text })}
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Максимальна кількість людей</Text>
                  <TextInput
                    style={styles.input}
                    value={eventForm.maxParticipants}
                    keyboardType="numeric"
                    onChangeText={(text) => setEventForm({ ...eventForm, maxParticipants: text })}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Для кого</Text>
                  <View style={styles.chips}>
                    {['будь-хто', 'чоловік', 'жінка'].map((option) => (
                      <TouchableOpacity key={option} style={[styles.chip, eventForm.genderPreference === option && styles.selectedChip]} onPress={() => setEventForm({ ...eventForm, genderPreference: option })}>
                        <Text style={[styles.chipText, eventForm.genderPreference === option && styles.selectedChipText]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Дата</Text>
              <View style={styles.chips}>
                {days.map((day, index) => (
                  <TouchableOpacity key={day.label} style={[styles.chip, selectedDayIndex === index && styles.selectedChip]} onPress={() => setSelectedDayIndex(index)}>
                    <Text style={[styles.chipText, selectedDayIndex === index && styles.selectedChipText]}>{day.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Час</Text>
              <View style={styles.chips}>
                {TIME_SLOTS.map((time) => (
                  <TouchableOpacity key={time} style={[styles.chip, selectedTime === time && styles.selectedChip]} onPress={() => setSelectedTime(time)}>
                    <Text style={[styles.chipText, selectedTime === time && styles.selectedChipText]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Локація</Text>
              <Text style={styles.authHint}>Знайди вулицю або натисни на карту, щоб поставити власну мітку.</Text>
              <View style={styles.locationSearchRow}>
                <TextInput
                  style={[styles.input, styles.locationSearchInput]}
                  placeholder="Введіть адресу для пошуку"
                  placeholderTextColor="#777790"
                  value={addressQuery}
                  onChangeText={setAddressQuery}
                  onSubmitEditing={searchAddress}
                  returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchButton} onPress={searchAddress}>
                  <Text style={{ color: '#FFFFFF', fontSize: 22 }}>{searchingAddress ? '…' : '⌕'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.locationButton} onPress={useCurrentLocation}>
                <Text style={styles.locationButtonText}>◎  Використати моє місцезнаходження</Text>
              </TouchableOpacity>
              {addressResults.length > 0 && (
                <View style={styles.addressResults}>
                  {addressResults.map((result) => (
                    <TouchableOpacity key={result.place_id} style={styles.addressResult} onPress={() => selectAddress(result)}>
                      <Text style={styles.addressResultText}>{result.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.mapCard}>
                <MapView
                  style={styles.map}
                  region={{ ...mapPosition, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
                  onPress={(event) => {
                    const nextPosition = event?.nativeEvent?.coordinate || event;
                    handleMapSelection(nextPosition);
                  }}
                >
                  <Marker coordinate={mapPosition}>
                    <View style={styles.customMarker}><Text style={styles.customMarkerText}>+</Text></View>
                  </Marker>
                </MapView>
              </View>
              <Text style={styles.authHint}>Обрано: {mapPosition.latitude.toFixed(5)}, {mapPosition.longitude.toFixed(5)}</Text>

              <Text style={styles.label}>Коментар</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={eventForm.comment}
                multiline
                onChangeText={(text) => setEventForm({ ...eventForm, comment: text })}
              />

              <TouchableOpacity style={styles.formButton} onPress={handleCreateEvent}>
                <Text style={styles.formButtonText}>Створити подію</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {activeTab === 'my' && (
          <ScrollView style={styles.myEventsScreen} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <View style={styles.myEventsHeader}>
              <TouchableOpacity onPress={goToMainMenu}>
                <Text style={styles.myEventsBack}>←  Головне меню</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.myEventsHero}>
              <Text style={styles.myEventsEyebrow}>Твій простір</Text>
              <Text style={styles.myEventsTitle}>Мої події</Text>
              <Text style={styles.myEventsSubtitle}>Тут зібрані зустрічі, до яких ти приєднався, і події, які створив сам.</Text>
            </View>
            <View style={styles.mySectionHeader}>
              <Text style={styles.mySectionTitle}>Я приєднався</Text>
              <Text style={styles.mySectionCount}>{myEvents.joined.length} подій</Text>
            </View>
            {myEvents.joined.length === 0 ? (
              <View style={styles.myEmptyState}><Text style={styles.myEmptyStateText}>Ти ще не приєднався до подій.</Text></View>
            ) : myEvents.joined.map((item) => (
              <TouchableOpacity key={`joined-${item.id}`} style={styles.myEventCard} onPress={() => openChat(item)}>
                <View style={styles.myEventTop}>
                  <View style={styles.myEventIcon}><Text style={{ fontSize: 20 }}>⌁</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.myEventTitle}>{item.type}</Text>
                    <Text style={[styles.myEventStatus, item.status !== 'active' && styles.myEventStatusCancelled]}>{item.status === 'cancelled' ? 'Скасована' : item.status === 'finished' ? 'Завершена' : 'Активна'}</Text>
                  </View>
                </View>
                <Text style={styles.myEventMeta}>Організатор: {item.organizer?.name || 'Невідомо'}</Text>
                <Text style={styles.myEventMeta}>Учасників: {item.participantCount || 1} / {item.maxParticipants || '—'}</Text>
                <Text style={styles.myEventComment}>{item.comment || 'Без опису'}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>💬  Відкрити чат</Text></View>
              </TouchableOpacity>
            ))}

            <View style={styles.mySectionHeader}>
              <Text style={styles.mySectionTitle}>Я організатор</Text>
              <Text style={styles.mySectionCount}>{myEvents.organized.length} подій</Text>
            </View>
            {myEvents.organized.length === 0 ? (
              <View style={styles.myEmptyState}><Text style={styles.myEmptyStateText}>Ти ще не створив подій.</Text></View>
            ) : myEvents.organized.map((item) => (
              <View key={`organized-${item.id}`} style={[styles.myEventCard, styles.myEventCardOrganizer]}>
                <View style={styles.myEventTop}>
                  <View style={[styles.myEventIcon, styles.myEventIconOrganizer]}><Text style={{ fontSize: 20 }}>✦</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.myEventTitle}>{item.type}</Text>
                    <Text style={[styles.myEventStatus, item.status !== 'active' && styles.myEventStatusCancelled]}>{item.status === 'cancelled' ? 'Скасована' : item.status === 'finished' ? 'Завершена' : 'Активна'}</Text>
                  </View>
                </View>
                <Text style={styles.myEventMeta}>Учасників: {item.participantCount || 1} / {item.maxParticipants || '—'}</Text>
                <Text style={styles.myEventComment}>{item.comment || 'Без опису'}</Text>
                <View style={styles.myEventActions}>
                  <TouchableOpacity style={styles.myEventChatButton} onPress={() => openChat(item)}>
                    <Text style={styles.myEventChatButtonText}>💬  Відкрити чат</Text>
                  </TouchableOpacity>
                  {item.status === 'active' && <TouchableOpacity style={styles.myEventCancelButton} onPress={() => cancelEvent(item)}>
                    <Text style={styles.myEventCancelButtonText}>Скасувати</Text>
                  </TouchableOpacity>}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'chat' && (
          <View style={styles.chatScreen}>
                <View style={styles.chatHeaderCard}>
                  <View style={styles.chatHeaderRow}>
                    <View style={styles.chatEventIcon}><Text style={{ fontSize: 20 }}>💬</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chatEventTitle}>{selectedEvent.type}</Text>
                      <Text style={styles.chatEventMeta}>{selectedEvent.participantCount || 1} / {selectedEvent.maxParticipants || '—'} учасників</Text>
                    </View>
                    <TouchableOpacity onPress={goBackFromChat} style={styles.chatBackButton}>
                      <Text style={styles.chatBackButtonText}>‹</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedEvent.organizerId === user?.id && (
                    <TouchableOpacity style={{ marginTop: 10 }} onPress={() => setShowParticipants((current) => !current)}>
                      <Text style={styles.secondaryButtonText}>{showParticipants ? 'Сховати учасників' : `👥  Учасники (${participants.length})`}</Text>
                    </TouchableOpacity>
                  )}
                  {showParticipants && selectedEvent.organizerId === user?.id && (
                    <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled>
                      <View style={styles.participantPanel}>
                        {participants.length === 0 ? <Text style={styles.chatEventMeta}>Поки ніхто не приєднався.</Text> : participants.map((participant) => (
                          <View key={participant.id}>
                            <View style={styles.participantRow}>
                              <View style={styles.participantAvatar}>
                                {participant.avatarUrl ? <Image source={{ uri: resolveAssetUrl(participant.avatarUrl) }} style={styles.avatarImage} /> : <Text style={styles.participantAvatarText}>{(participant.name || 'У').charAt(0).toUpperCase()}</Text>}
                              </View>
                              <Text style={styles.participantName}>{participant.name}</Text>
                              <TouchableOpacity onPress={() => setParticipantMenuId((current) => current === participant.id ? null : participant.id)} style={styles.blockParticipantButton}>
                                <Text style={styles.blockParticipantText}>⚙</Text>
                              </TouchableOpacity>
                            </View>
                            {participantMenuId === participant.id && <View style={styles.participantMenu}>
                              <TouchableOpacity style={styles.participantMenuAction} onPress={() => { setParticipantMenuId(null); blockParticipant(participant); }}>
                                <Text style={styles.participantMenuActionText}>⊘  Заблокувати для цієї події</Text>
                              </TouchableOpacity>
                            </View>}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
                {messages.some((message) => message.isPinned) && <View style={styles.pinnedStrip}>
                  {(() => {
                    const pinnedMessages = messages.filter((message) => message.isPinned);
                    const activeIndex = activePinnedIndex;
                    const activeMessage = pinnedMessages[activeIndex];
                    return <TouchableOpacity style={styles.pinnedItem} onPress={openPinnedMessage}>
                      <Text style={styles.pinnedStripHeader}>📌  Закріплене повідомлення {activeIndex + 1}/{pinnedMessages.length}</Text>
                      <Text style={styles.pinnedItemText} numberOfLines={1}>{activeMessage.text}</Text>
                    </TouchableOpacity>;
                  })()}
                </View>}
                <ScrollView
                  ref={messageListRef}
                  style={styles.messageList}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={(_, height) => setMessageContentHeight(height)}
                  onScroll={(event) => {
                    const { contentOffset, layoutMeasurement } = event.nativeEvent;
                    const isNearBottom = contentOffset.y + layoutMeasurement.height >= messageContentHeight - 80;
                    setShowScrollToBottom(messageContentHeight > layoutMeasurement.height && !isNearBottom);
                  }}
                  scrollEventThrottle={100}
                >
                  {messages.map((message) => (
                    <TouchableOpacity
                      key={message.id || `${message.createdAt}-${message.text}`}
                      activeOpacity={0.88}
                      onLayout={(event) => { messageOffsets.current[message.id] = event.nativeEvent.layout.y; }}
                      onPress={() => selectedEvent.organizerId === user?.id && setMessageMenuId((current) => current === message.id ? null : message.id)}
                      style={[styles.messageBubble, message.senderId === user.id && styles.ownMessage, message.id === activePinnedMessageId && styles.pinnedMessage]}
                    >
                      {message.id === activePinnedMessageId && <Text style={styles.pinnedLabel}>📌  Активне закріплене</Text>}
                      <View style={styles.messageRow}>
                        <View style={styles.messageAvatar}>
                          {(message.sender?.avatarUrl || (message.senderId === user.id && user?.avatarUrl)) ? (
                            <Image source={{ uri: resolveAssetUrl(message.sender?.avatarUrl || user?.avatarUrl) }} style={styles.avatarImage} />
                          ) : (
                            <Text style={styles.participantAvatarText}>{(message.sender?.name || (message.senderId === user.id ? user?.name : 'Учасник') || 'У').charAt(0).toUpperCase()}</Text>
                          )}
                        </View>
                        <Text style={styles.messageAuthor}>{message.sender?.name || (message.senderId === user.id ? 'Ти' : 'Учасник')}</Text>
                      </View>
                      <Text style={styles.messageText}>{message.text}</Text>
                      <Text style={styles.messageTime}>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                      {messageMenuId === message.id && selectedEvent.organizerId === user?.id && <View style={styles.messageActionMenu}>
                        <TouchableOpacity style={styles.messageActionButton} onPress={() => { setMessageMenuId(null); togglePinnedMessage(message); }}>
                          <Text style={styles.messageActionText}>{message.isPinned ? 'Відкріпити' : '📌  Закріпити'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.messageActionButton} onPress={() => setMessageMenuId(null)}>
                          <Text style={styles.messageActionText}>Закрити</Text>
                        </TouchableOpacity>
                      </View>}
                    </TouchableOpacity>
                  ))}
                  {messages.length === 0 && <View style={styles.chatEmptyState}><View style={styles.chatEmptyIcon}><Text style={{ fontSize: 24 }}>✦</Text></View><Text style={styles.messageAuthor}>Чат ще порожній</Text><Text style={styles.chatEventMeta}>Напиши перше повідомлення учасникам</Text></View>}
                </ScrollView>
                {showScrollToBottom && <TouchableOpacity style={styles.scrollBottomButton} onPress={scrollToBottom}>
                  <Text style={styles.scrollBottomText}>↓</Text>
                </TouchableOpacity>}
                <View style={styles.chatComposer}>
                  <TextInput
                    style={[styles.input, styles.chatInput]}
                    placeholder="Напиши повідомлення..."
                    value={chatText}
                    onChangeText={setChatText}
                    onSubmitEditing={sendMessage}
                  />
                  <TouchableOpacity style={styles.compactButton} onPress={sendMessage}>
                    <Text style={styles.compactButtonText}>➤</Text>
                  </TouchableOpacity>
                </View>
          </View>
        )}

        {activeTab === 'profile' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarWrap}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarPlaceholder}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.formTitle}>{user?.name || 'Профіль'}</Text>
              </View>

              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={styles.avatarButton}
                  onPress={triggerAvatarPicker}
                  disabled={isUploadingAvatar}
                >
                  <Text style={styles.avatarButtonText}>{isUploadingAvatar ? 'Завантаження...' : 'Додати фото'}</Text>
                </TouchableOpacity>
                {Platform.OS === 'web' && (
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                      event.target.value = '';
                    }}
                  />
                )}
              </View>

              <Text style={styles.label}>Ім’я</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} />
              <Text style={styles.label}>Вік</Text>
              <TextInput style={styles.input} value={editAge} onChangeText={setEditAge} keyboardType="numeric" />
              <Text style={styles.metaText}>Телефон: {user?.phone}</Text>
              <Text style={styles.metaText}>Стать: {user?.gender}</Text>
              <View style={{ marginTop: 12, marginBottom: 8, alignItems: 'flex-start' }}>
                <View style={{ backgroundColor: userVerificationColor, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ color: '#17172A', fontWeight: '800', fontSize: 12 }}>{userVerificationState}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.formButton} onPress={saveProfile}>
                <Text style={styles.formButtonText}>Зберегти профіль</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
