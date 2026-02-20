import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Icon } from './components/Icon';
import { Visualizer, VisualizerMode } from './components/Visualizer';
import { Equalizer } from './components/Equalizer';
import { Track, RepeatMode } from './types';

const DB_NAME = 'SCOC_BiblePlayer_DB';
const STORE_NAME = 'tracks';
const STORAGE_KEY_SETTINGS = 'scoc_settings';
const STORAGE_KEY_LAST_INDEX = 'scoc_last_index';
const STORAGE_KEY_LAST_TIME = 'scoc_last_time';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const getImageUrl = (id: string, size: number) => {
    const targetSize = Math.max(size, 600);
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash |= 0; 
    }
    const seed = Math.abs(hash);
    
    // 전세계 유명한 대자연, 따뜻함, 웅장함, 실사, 사진작가 스타일 프롬프트
    const prompts = [
        "Grand Canyon at golden hour, majestic red rock layers, warm sunlight, photorealistic",
        "Aurora Borealis over a frozen lake in Iceland, majestic green lights, starry night, professional photography",
        "Swiss Alps mountain peaks, dramatic snowy mountains, clear blue sky, majestic landscape",
        "Salar de Uyuni Bolivia, mirror reflection on salt flats, sunset colors, vast and majestic",
        "Antelope Canyon Arizona, smooth sandstone curves, beam of warm light, detailed texture",
        "Great Barrier Reef, vibrant coral underwater, turquoise clear water, realistic nature",
        "Plitvice Lakes Croatia, cascading waterfalls, emerald green water, lush forest",
        "Mount Fuji Japan, snow capped peak, cherry blossoms in foreground, peaceful and majestic",
        "Sahara Desert, rolling sand dunes, warm orange sunset light, vast emptiness",
        "Banff National Park, turquoise Moraine Lake, valley of ten peaks, majestic Canada nature",
        "Victoria Falls, massive waterfall, mist rising, rainbows, powerful nature",
        "Lavender fields in Provence, endless purple flowers, warm summer sunset",
        "Amazon Rainforest, aerial view of winding river, lush green jungle, majestic earth",
        "Yosemite Valley, El Capitan cliff, pine forests, dramatic lighting, majestic nature",
        "Santorini caldera view ocean, deep blue sea, volcanic cliffs, warm sun, nature focus",
        "Yellowstone Grand Prismatic Spring, vivid colors, steam, aerial nature shot",
        "Dolomites Italy, jagged mountain peaks, green rolling hills, dramatic clouds",
        "Baobab Avenue Madagascar, giant ancient trees against a warm sunset sky",
        "Ha Long Bay, limestone karsts rising from water, misty and majestic",
        "Milford Sound New Zealand, dramatic fiord, waterfalls, moody lighting",
        "Autumn forest in Kyoto, vibrant red maple leaves, warm sunlight filtering through",
        "Great Ocean Road, Twelve Apostles limestone stacks, dramatic ocean waves",
        "Rocky Mountains Colorado, reflection in alpine lake, majestic wilderness",
        "Namib Desert, deadvlei, orange dunes and blue sky, high contrast, warm",
        "Pamukkale Turkey, white travertine thermal pools, turquoise water, warm sunlight"
    ];

    const selectedPrompt = prompts[seed % prompts.length];
    
    // 사람, 신체 부위, 인공물 등 부정 프롬프트 대폭 강화
    const negativePrompts = [
        "no people", "no human", "no person", "no man", "no woman", "no child", "no girl", "no boy",
        "no face", "no hair", "no head", "no back of head", "no silhouette", "no shadow of person",
        "no skin", "no hands", "no feet", "no body parts", "no limbs", "no fingers",
        "no clothing", "no dress", "no accessories", "no glasses",
        "no machinery", "no machines", "no typewriter", "no mechanics", "no gears", 
        "no metal parts", "no industrial", "no indoor objects", "no technology", 
        "no man-made objects", "no architecture", "no buildings", "no houses",
        "no text", "no watermark", "no signature"
    ].join(", ");

    const encodedPrompt = encodeURIComponent(`${selectedPrompt}, landscape only, nature scenery only, award-winning nature photography, 8k resolution, highly detailed, photorealistic, cinematic lighting, wide angle, ${negativePrompts}`);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${targetSize}&height=${targetSize}&seed=${seed}&nologo=true`;
};

const AlbumArt = ({ trackId, size, className }: { trackId: string, size: number, className?: string }) => {
    const primaryUrl = useMemo(() => getImageUrl(trackId, size), [trackId, size]);
    const [src, setSrc] = useState(primaryUrl);
    useEffect(() => { setSrc(getImageUrl(trackId, size)); }, [trackId, size]);
    return (
        <img 
            src={src} 
            alt="Album Art" 
            className={`${className} object-cover bg-gray-700`} 
            onError={() => setSrc(`https://picsum.photos/seed/${trackId}/${size}/${size}`)}
            loading="lazy"
        />
    );
};

const eqFrequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000];
const visualizerModes: VisualizerMode[] = ['line', 'bars', 'wave', 'circle', 'dots'];

// Fallback용 텍스트 로고 컴포넌트 복구
const ScocTextLogo = ({ className }: { className?: string }) => (
  <span className={`${className} text-xl font-bold tracking-tight text-white`}>SCOC</span>
);

export default function App() {
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.NONE);
    const [isShuffled, setIsShuffled] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [showVisualizer, setShowVisualizer] = useState(true);
    const [visualizerModeIndex, setVisualizerModeIndex] = useState(0);
    const [isEqVisible, setIsEqVisible] = useState(false);
    const [eqGains, setEqGains] = useState<number[]>(() => Array(eqFrequencies.length).fill(0));
    const [sortConfig, setSortConfig] = useState<{ key: 'fileName' | 'artist', direction: 'asc' | 'desc' }>({ key: 'fileName', direction: 'asc' });
    const [logoError, setLogoError] = useState(false); // 로고 로딩 에러 상태

    const audioRef = useRef<HTMLAudioElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
    const wakeLockRef = useRef<any>(null);

// --- 여기에 삽입 시작 --- 
    const askGemini = async (userPrompt: string) => {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userPrompt }),
            });

            if (!response.ok) throw new Error('네트워크 응답에 문제가 있습니다.');

            const data = await response.json();
            // Gemini API의 응답 구조에 맞춰 텍스트 추출
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "응답을 가져오지 못했습니다.";
            return aiText;
        } catch (error) {
            console.error("Gemini 호출 중 에러 발생:", error);
            return "에러가 발생했습니다. 다시 시도해주세요.";
        }
    };
// --- 여기에 삽입 끝 ---

    const stateRef = useRef({ playlist, currentTrackIndex, isShuffled, repeatMode, isPlaying });
    useEffect(() => {
        stateRef.current = { playlist, currentTrackIndex, isShuffled, repeatMode, isPlaying };
    }, [playlist, currentTrackIndex, isShuffled, repeatMode, isPlaying]);

    // IndexedDB 로드 및 상태 복구
    useEffect(() => {
        const loadFromDB = async () => {
            try {
                const db = await openDB();
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    let tracks: Track[] = request.result.map((item: any) => ({
                        ...item,
                        url: URL.createObjectURL(item.file)
                    }));
                    
                    tracks.sort((a, b) => a.file.name.localeCompare(b.file.name));

                    if (tracks.length > 0) {
                        setPlaylist(tracks);

                        // --- 상태 복구 로직 (설정 및 마지막 재생 위치) ---
                        try {
                            const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
                            if (savedSettings.volume !== undefined) setVolume(savedSettings.volume);
                            if (savedSettings.repeatMode !== undefined) setRepeatMode(savedSettings.repeatMode);
                            if (savedSettings.isShuffled !== undefined) setIsShuffled(savedSettings.isShuffled);
                            if (savedSettings.visualizerModeIndex !== undefined) setVisualizerModeIndex(savedSettings.visualizerModeIndex);
                            if (savedSettings.showVisualizer !== undefined) setShowVisualizer(savedSettings.showVisualizer);
                            if (savedSettings.isEqVisible !== undefined) setIsEqVisible(savedSettings.isEqVisible);
                            if (savedSettings.eqGains) setEqGains(savedSettings.eqGains);

                            const lastIndex = localStorage.getItem(STORAGE_KEY_LAST_INDEX);
                            const lastTime = localStorage.getItem(STORAGE_KEY_LAST_TIME);

                            if (lastIndex !== null) {
                                const idx = parseInt(lastIndex);
                                if (tracks[idx]) {
                                    setCurrentTrackIndex(idx);
                                    
                                    // Audio Element 설정
                                    if (audioRef.current) {
                                        audioRef.current.src = tracks[idx].url;
                                        if (lastTime) {
                                            const t = parseFloat(lastTime);
                                            if (!isNaN(t)) {
                                                // 메타데이터 로드 후 시간 설정 (안전성 확보)
                                                const setTimeOnce = () => {
                                                    if (audioRef.current) {
                                                        audioRef.current.currentTime = t;
                                                        setCurrentTime(t);
                                                    }
                                                };
                                                audioRef.current.addEventListener('loadedmetadata', setTimeOnce, { once: true });
                                            }
                                        }
                                        // 주의: 브라우저 정책상 자동 재생은 시도하지 않고 준비 상태로 둠
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("Failed to restore state:", e);
                        }
                        // ------------------------------------------------
                    }
                };
            } catch (err) {
                console.error("DB Load Error:", err);
            }
        };
        loadFromDB();
    }, []);

    // 설정 값 변경 시 저장
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
            volume,
            repeatMode,
            isShuffled,
            showVisualizer,
            visualizerModeIndex,
            isEqVisible,
            eqGains
        }));
    }, [volume, repeatMode, isShuffled, showVisualizer, visualizerModeIndex, isEqVisible, eqGains]);

    // 재생 상태(곡 인덱스, 시간) 저장 로직
    useEffect(() => {
        const savePlaybackState = () => {
            if (currentTrackIndex !== null) {
                localStorage.setItem(STORAGE_KEY_LAST_INDEX, currentTrackIndex.toString());
            }
            if (audioRef.current) {
                localStorage.setItem(STORAGE_KEY_LAST_TIME, audioRef.current.currentTime.toString());
            }
        };

        // 트랙이 바뀔 때마다 인덱스 저장
        if (currentTrackIndex !== null) {
            localStorage.setItem(STORAGE_KEY_LAST_INDEX, currentTrackIndex.toString());
        }

        // 화면이 가려지거나(백그라운드), 닫힐 때 시간 저장
        window.addEventListener('beforeunload', savePlaybackState);
        document.addEventListener('visibilitychange', savePlaybackState);
        
        // 추가: 주기적으로 저장 (크래시 대비, 5초 간격)
        const interval = setInterval(savePlaybackState, 5000);

        return () => {
            window.removeEventListener('beforeunload', savePlaybackState);
            document.removeEventListener('visibilitychange', savePlaybackState);
            clearInterval(interval);
        };
    }, [currentTrackIndex]);

    const setupAudioContext = useCallback(() => {
        if (!audioRef.current) return null;
        if (audioContext && audioContext.state !== 'closed') return audioContext;

        const context = new (window.AudioContext || (window as any).webkitAudioContext)({ 
            latencyHint: 'playback',
            sampleRate: 44100 
        });
        
        context.onstatechange = () => {};

        const source = context.createMediaElementSource(audioRef.current);
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;

        const filters = eqFrequencies.map((freq) => {
            const filter = context.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.gain.value = 0;
            filter.Q.value = 1.4;
            return filter;
        });
        
        eqFiltersRef.current = filters;
        const connectedFilters = filters.reduce((prev, curr) => {
            prev.connect(curr);
            return curr;
        }, source as AudioNode);
        
        connectedFilters.connect(analyser);
        analyser.connect(context.destination);

        setAudioContext(context);
        setAnalyserNode(analyser);
        return context;
    }, [audioContext]);

    const updateMediaSessionMetadata = useCallback((track: Track) => {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.name,
            artist: track.artist,
            album: '친구들이 들려주는 성경말씀',
            artwork: [
                { src: getImageUrl(track.id, 512), sizes: '512x512', type: 'image/png' },
                { src: getImageUrl(track.id, 256), sizes: '256x256', type: 'image/png' },
                { src: getImageUrl(track.id, 128), sizes: '128x128', type: 'image/png' }
            ]
        });
    }, []);

    const displayedPlaylist = useMemo(() => {
        return [...playlist]
            .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.artist.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                const dir = sortConfig.direction === 'asc' ? 1 : -1;
                const valA = sortConfig.key === 'fileName' ? a.file.name : a.artist;
                const valB = sortConfig.key === 'fileName' ? b.file.name : b.artist;
                return valA.localeCompare(valB) * dir;
            });
    }, [playlist, searchTerm, sortConfig]);

    const playTrack = useCallback(async (index: number) => {
        const { playlist } = stateRef.current;
        if (!playlist[index] || !audioRef.current) return;

        const track = playlist[index];
        const audio = audioRef.current;

        updateMediaSessionMetadata(track);
        const ctx = setupAudioContext();
        
        if (ctx && ctx.state === 'suspended') {
            await ctx.resume().catch(e => console.warn("AudioContext resume failed:", e));
        }

        if (audio.src !== track.url) {
            audio.pause();
            audio.src = track.url;
            audio.load();
        }

        setCurrentTrackIndex(index);
        
        try {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                await playPromise;
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Playback failed:", err);
            }
        }
    }, [setupAudioContext, updateMediaSessionMetadata]);

    const handlePlayPause = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || stateRef.current.playlist.length === 0) return;

        const ctx = setupAudioContext();

        if (stateRef.current.isPlaying) {
            audio.pause();
            if (ctx && ctx.state === 'running') {
                await ctx.suspend(); 
            }
        } else {
            if (stateRef.current.currentTrackIndex === null) {
                await playTrack(0);
                return;
            }

            if (ctx && ctx.state === 'suspended') {
                await ctx.resume().catch(() => {});
            }

            try {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') console.error("Play failed:", err);
            }
        }
    }, [setupAudioContext, playTrack]);

    const handleNext = useCallback(() => {
        const { playlist, currentTrackIndex, isShuffled, repeatMode } = stateRef.current;
        if (playlist.length === 0) return;

        if (isShuffled) {
            const nextIndex = Math.floor(Math.random() * playlist.length);
            playTrack(nextIndex);
        } else {
            const currentTrackId = playlist[currentTrackIndex || 0]?.id;
            const currentDisplayIndex = displayedPlaylist.findIndex(t => t.id === currentTrackId);
            
            if (currentDisplayIndex === -1) {
                playTrack((currentTrackIndex || 0) + 1);
                return;
            }

            let nextDisplayIndex = currentDisplayIndex + 1;
            if (nextDisplayIndex >= displayedPlaylist.length) {
                if (repeatMode === RepeatMode.ALL) {
                    nextDisplayIndex = 0;
                } else {
                    if (audioRef.current) audioRef.current.pause();
                    return;
                }
            }

            const nextTrack = displayedPlaylist[nextDisplayIndex];
            const originalIndex = playlist.findIndex(t => t.id === nextTrack.id);
            playTrack(originalIndex);
        }
    }, [playTrack, displayedPlaylist]);

    const handlePrev = useCallback(() => {
        const { playlist, currentTrackIndex } = stateRef.current;
        if (playlist.length === 0) return;

        const currentTrackId = playlist[currentTrackIndex || 0]?.id;
        const currentDisplayIndex = displayedPlaylist.findIndex(t => t.id === currentTrackId);

        let prevDisplayIndex = currentDisplayIndex - 1;
        if (prevDisplayIndex < 0) {
            prevDisplayIndex = displayedPlaylist.length - 1;
        }

        const prevTrack = displayedPlaylist[prevDisplayIndex];
        const originalIndex = playlist.findIndex(t => t.id === prevTrack.id);
        playTrack(originalIndex);
    }, [playTrack, displayedPlaylist]);

    const handleSeek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;
        const audio = audioRef.current;

        navigator.mediaSession.setActionHandler('play', async () => {
             if (audioContext && audioContext.state === 'suspended') await audioContext.resume();
             audio?.play().catch(() => {});
        });
        navigator.mediaSession.setActionHandler('pause', async () => {
             audio?.pause();
             if (audioContext && audioContext.state === 'running') await audioContext.suspend();
        });
        navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
        navigator.mediaSession.setActionHandler('nexttrack', handleNext);
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined) handleSeek(details.seekTime);
        });

        return () => {
            ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto'].forEach(action => {
                navigator.mediaSession.setActionHandler(action as MediaSessionAction, null);
            });
        };
    }, [handleNext, handlePrev, handleSeek, audioContext]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const keepAliveInterval = setInterval(() => {
            if (isPlaying && audioContext && audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
            }
        }, 2000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                if (isPlaying && audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().catch(() => {});
                }
                
                if (isPlaying && audio && audio.paused) {
                    audio.play().catch(() => {});
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession && isPlaying) {
                try {
                    navigator.mediaSession.setPositionState({
                        duration: audio.duration || 0,
                        playbackRate: audio.playbackRate,
                        position: audio.currentTime
                    });
                } catch (e) {}
            }
        };

        const onEnded = () => {
            if (stateRef.current.repeatMode === RepeatMode.ONE) {
                audio.currentTime = 0;
                audio.play().catch(() => {});
            } else {
                handleNext();
            }
        };

        const onPlay = () => {
            setIsPlaying(true);
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            if (audioContext && audioContext.state === 'suspended') audioContext.resume().catch(() => {});
        };

        const onPause = () => {
            setIsPlaying(false);
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            clearInterval(keepAliveInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', () => setDuration(audio.duration));
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, [handleNext, audioContext, isPlaying]);

    useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
    useEffect(() => {
        eqFiltersRef.current.forEach((filter, i) => {
            if (filter) filter.gain.setTargetAtTime(eqGains[i], (audioContext?.currentTime || 0), 0.1);
        });
    }, [eqGains, audioContext]);

    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && isPlaying) {
                try { 
                    if (wakeLockRef.current) await wakeLockRef.current.release();
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); 
                } catch (err) {}
            }
        };
        if (isPlaying) requestWakeLock();
        else if (wakeLockRef.current) { 
            wakeLockRef.current.release().catch(() => {}); 
            wakeLockRef.current = null; 
        }
    }, [isPlaying]);

    const handleDeleteTrack = async (e: React.MouseEvent, trackId: string) => {
        e.stopPropagation();
        try {
            const db = await openDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.delete(trackId);
            
            transaction.oncomplete = () => {
                setPlaylist(prev => {
                    const deletedIndex = prev.findIndex(t => t.id === trackId);
                    const newPlaylist = prev.filter(t => t.id !== trackId);
                    
                    if (currentTrackIndex !== null) {
                        const currentTrack = prev[currentTrackIndex];
                        if (currentTrack && currentTrack.id === trackId) {
                            if (audioRef.current) {
                                audioRef.current.pause();
                                audioRef.current.src = "";
                            }
                            setIsPlaying(false);
                            setCurrentTrackIndex(null);
                        } else if (deletedIndex < currentTrackIndex) {
                            setCurrentTrackIndex(currentTrackIndex - 1);
                        }
                    }
                    return newPlaylist;
                });
            };
        } catch (err) {
            console.error("Delete Error:", err);
        }
    };

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (!fileList || fileList.length === 0) return;

        const files = Array.from(fileList) as File[];
        const db = await openDB();
        
        const tracksToAdd: Track[] = files.map((file, i) => {
            const url = URL.createObjectURL(file);
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            
            return {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${i}`,
                file,
                name: fileName,
                artist: 'Unknown Artist',
                duration: 0,
                url
            };
        });

        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        tracksToAdd.forEach(t => {
            const { url, ...saveData } = t; 
            store.put(saveData);
        });

        setPlaylist(prev => {
            const updated = [...prev, ...tracksToAdd].sort((a, b) => a.file.name.localeCompare(b.file.name));
            if (prev.length === 0 && updated.length > 0) {
                requestAnimationFrame(() => playTrack(0));
            }
            return updated;
        });

        tracksToAdd.forEach(track => {
            const tempAudio = new Audio();
            tempAudio.src = track.url;
            tempAudio.onloadedmetadata = async () => {
                const dur = tempAudio.duration;
                setPlaylist(prev => prev.map(t => t.id === track.id ? { ...t, duration: dur } : t));
                
                const upTx = db.transaction(STORE_NAME, 'readwrite');
                const upStore = upTx.objectStore(STORE_NAME);
                const req = upStore.get(track.id);
                req.onsuccess = () => {
                   if(req.result) {
                       req.result.duration = dur;
                       upStore.put(req.result);
                   }
                };
                tempAudio.src = '';
            };

            const jsmediatags = (window as any).jsmediatags;
            if (jsmediatags) {
                jsmediatags.read(track.file, {
                    onSuccess: (tag: any) => {
                        const { title, artist: tagArtist } = tag.tags;
                        if (title) { 
                            setPlaylist(prev => prev.map(t => t.id === track.id ? { 
                                ...t, 
                                name: title, 
                                artist: tagArtist || t.artist 
                            } : t));

                            const upTx = db.transaction(STORE_NAME, 'readwrite');
                            const upStore = upTx.objectStore(STORE_NAME);
                            const req = upStore.get(track.id);
                            req.onsuccess = () => {
                                const data = req.result;
                                if (data) {
                                    data.name = title;
                                    data.artist = tagArtist || data.artist;
                                    upStore.put(data);
                                }
                            };
                        }
                    },
                    onError: (error: any) => {
                        console.log('jsmediatags error:', error);
                    }
                });
            }
        });

        event.target.value = '';
    }, [playTrack]);

    const currentTrack = useMemo(() => {
        return currentTrackIndex !== null && playlist[currentTrackIndex] ? playlist[currentTrackIndex] : null;
    }, [playlist, currentTrackIndex]);

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center font-sans text-white bg-[#0f172a] overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at top left, #1e293b, #0f172a 40%)' }}>
            <div className="w-full h-full md:w-[950px] md:h-[720px] bg-gray-800/70 backdrop-blur-sm md:rounded-lg shadow-2xl flex flex-col overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/90 z-10">
                    <div className="flex items-center space-x-4">
                        <Icon name="bible" className="w-10 h-10 text-cyan-400" />
                        <h1 className="text-xl font-bold tracking-tight truncate">친구들이 들려주는 성경말씀</h1>
                    </div>
                    <a href="https://scoc.net/" target="_blank" rel="noopener noreferrer" className="ml-4 hover:opacity-80 transition-opacity" title="서울그리스도의 교회 홈페이지 방문">
                        {logoError ? (
                            <ScocTextLogo />
                        ) : (
                            <img 
                                src="scoc_logo.png" 
                                alt="SCOC" 
                                className="h-5 w-auto object-contain md:h-7"
                                onError={() => setLogoError(true)}
                            />
                        )}
                    </a>
                </header>

                <main className="flex-grow flex flex-col md:flex-row relative overflow-hidden">
                    <aside className={`transition-all duration-300 z-30 ${isSidebarVisible ? 'fixed inset-0 bg-gray-900 md:static md:w-1/3 md:bg-black/20 flex flex-col' : 'hidden md:hidden'}`}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                            <h2 className="font-bold">파일 목록 ({displayedPlaylist.length})</h2>
                            <button onClick={() => setIsSidebarVisible(false)} className="p-2 md:hidden" title="목록 닫기"><Icon name="close" className="w-8 h-8" /></button>
                        </div>
                        <div className="overflow-y-auto p-3 space-y-2 flex-grow">
                            {displayedPlaylist.length === 0 && <p className="text-center text-gray-500 mt-10">목록이 비었습니다.</p>}
                            {displayedPlaylist.map((track) => (
                                <div key={track.id} 
                                     onClick={() => playTrack(playlist.findIndex(t => t.id === track.id))}
                                     title={`${track.name} 재생`}
                                     className={`group flex items-center p-3 rounded-lg cursor-pointer transition-colors ${currentTrack?.id === track.id ? 'bg-cyan-500/30' : 'hover:bg-white/10'}`}>
                                    <AlbumArt trackId={track.id} size={48} className="w-12 h-12 rounded-md mr-4" />
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-semibold truncate">{track.name}</p>
                                        <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                                    </div>
                                    <button onClick={(e) => handleDeleteTrack(e, track.id)} className="p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity" title="파일 삭제"><Icon name="trash" className="w-5 h-5" /></button>
                                </div>
                            ))}
                        </div>
                    </aside>

                    <section className="flex flex-col w-full h-full p-6 space-y-6 flex-grow">
                        <div className="flex-grow bg-black/30 rounded-xl relative overflow-hidden flex items-center justify-center">
                            {showVisualizer ? <Visualizer analyserNode={analyserNode} mode={visualizerModes[visualizerModeIndex]} /> : 
                                (currentTrack ? <AlbumArt trackId={currentTrack.id} size={600} className="w-full h-full" /> : <Icon name="music-note" className="w-32 h-32 opacity-10" />)}
                        </div>

                        <div className="text-center px-4">
                            <h2 className="text-2xl font-bold truncate">{currentTrack ? currentTrack.name : '재생할 곡을 선택하세요'}</h2>
                            <p className="text-cyan-200/70">{currentTrack ? currentTrack.artist : '-'}</p>
                        </div>

                        <div className="space-y-2">
                            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={(e) => handleSeek(parseFloat(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-400" title="재생 위치 조절"/>
                            <div className="flex justify-between text-xs font-mono opacity-50">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* 모바일은 중앙 정렬, PC는 기존처럼 양 끝 정렬 */}
                         <div className="flex items-center justify-center md:justify-between bg-black/20 p-4 rounded-2xl relative">
    
                        {/* 아이콘 뭉치 전체 (셔플부터 다음곡까지) */}
                         <div className="flex items-center justify-center space-x-4 md:space-x-0 md:flex-grow">
        
                        {/* 1. 셔플 & 반복 그룹 (PC에서는 왼쪽 배치) */}
                       <div className="flex items-center space-x-2 md:space-x-4 mr-2 md:mr-0 md:w-1/3 md:justify-start">
                         <button onClick={() => setIsShuffled(!isShuffled)} 
                           className={`p-1 text-3xl md:text-4xl transition-colors ${isShuffled ? 'text-cyan-400' : 'opacity-40'}`}>
                        🔀
                    </button>
                      <button onClick={() => setRepeatMode(prev => (prev + 1) % 3)} 
                        className={`p-1 text-3xl md:text-4xl transition-colors ${repeatMode !== RepeatMode.NONE ? 'text-cyan-400' : 'opacity-40'}`}>
                     {repeatMode === RepeatMode.ONE ? '🔂' : '🔁'}
                    </button>
                   </div>

                  {/* 2. 메인 컨트롤 (이전, 재생, 다음) - PC에서는 정중앙 배치 */}
                  <div className="flex items-center justify-center space-x-6 md:space-x-8 md:w-1/3">
                   <button onClick={handlePrev} className="p-1">
                   <Icon name="prev" className="w-12 h-12 md:w-10 md:h-10" />
                </button>
                 <button 
                     onClick={handlePlayPause} 
                     className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-cyan-400 text-black rounded-full shadow-lg md:shadow-xl transform active:scale-95 md:hover:scale-110 transition-all duration-200 ease-in-out" 
                     title={isPlaying ? "일시정지" : "재생"}
                 >
                     <Icon 
                         name={isPlaying ? 'pause' : 'play'} 
                         className="w-12 h-12 md:w-14 md:h-14" 
                    />
                </button>
                      
                <button onClick={handleNext} className="p-1">
                <Icon name="next" className="w-12 h-12 md:w-10 md:h-10" />
               </button>
           </div>

             {/* 3. PC 레이아웃 균형을 위한 빈 공간 (모바일은 숨김) */}
             <div className="hidden md:block md:w-1/3"></div>
           </div>

           {/* 4. 볼륨 조절 바 (PC 우측 끝 고정, 모바일은 숨김) */}
           <div className="hidden md:block w-24">
             <input type="range" min="0" max="1" step="0.01" value={volume} 
                 onChange={(e) => setVolume(parseFloat(e.target.value))} 
                 className="w-full h-1.5 accent-cyan-400 cursor-pointer" />
          </div>
     </div>
                        

                        {/* 하단 보조 도구 모음 */}
                    <div className="flex items-center justify-between bg-black/20 p-2 rounded-xl">
                       {/* 1. 왼쪽 아이콘 그룹 (스크롤 가능하게 설정하여 검색창 침범 방지) */}
                      <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar mr-2 flex-grow-0">
                       <button onClick={() => fileInputRef.current?.click()} className="p-2 sm:p-3 text-gray-400 hover:text-white flex-shrink-0" title="파일 불러오기"><Icon name="folder" /></button>
                       <button onClick={() => setShowVisualizer(!showVisualizer)} className={`p-2 sm:p-3 flex-shrink-0 ${!showVisualizer ? 'text-cyan-400' : 'text-gray-400'}`} title={showVisualizer ? "앨범아트 보기" : "시각화 보기"}><Icon name="gallery" /></button>
                       <button onClick={() => setVisualizerModeIndex(p => (p + 1) % visualizerModes.length)} className="p-2 sm:p-3 text-gray-400 hover:text-white flex-shrink-0" title="시각화 모드 변경"><Icon name="chart-bar" /></button>
                       <button onClick={() => setIsEqVisible(true)} className="p-2 sm:p-3 text-gray-400 hover:text-white flex-shrink-0" title="이퀄라이저 열기"><Icon name="equalizer" /></button>
                       <button onClick={() => setIsSidebarVisible(true)} className="p-2 sm:p-3 text-gray-400 hover:text-white flex-shrink-0" title="목록 열기"><Icon name="list" /></button>
          </div>

                     {/* 2. 오른쪽 그룹 (검색창 + 초기화 버튼) */}
                 <div className="flex items-center justify-end flex-shrink-0 ml-auto">
                     <div className="relative group">
                         <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                            <Icon name="search" className="w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="검색" 
                            className="bg-gray-700/50 text-white text-xs sm:text-sm rounded-full pl-8 pr-2 py-1.5 w-24 sm:w-32 focus:w-28 sm:focus:w-48 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400 placeholder-gray-500 border border-transparent focus:bg-gray-700"
                            title="파일명 또는 아티스트 검색"
                        />
                    </div>
        
                   {/* 초기화 버튼: 모바일(기본)에서는 hidden, 컴퓨터(md 이상)에서만 block */}
                   <button 
                       onClick={() => { if(confirm("초기화하시겠습니까?")) { indexedDB.deleteDatabase(DB_NAME); location.reload(); } }} 
                       className="hidden md:block p-2 sm:p-3 text-gray-400 hover:text-white ml-2" 
                       title="앱 초기화 (DB삭제)"
                   >
                       <Icon name="refresh" />
                   </button>
               </div>
          </div>
                    
                    </section>
                </main>
                <audio 
                    ref={audioRef} 
                    playsInline 
                    // @ts-ignore
                    webkit-playsinline="true"
                    preload="auto" 
                    crossOrigin="anonymous" 
                    // @ts-ignore
                    x-webkit-airplay="allow"
                />
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac" onChange={handleFileChange} />
                {isEqVisible && <Equalizer onClose={() => setIsEqVisible(false)} gains={eqGains} setGains={setEqGains} frequencies={eqFrequencies} />}
            </div>
        </div>
    );
}
