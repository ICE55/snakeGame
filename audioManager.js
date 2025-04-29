// 音频管理器 - 解决音频播放问题
const AudioManager = {
    sounds: {},
    background: null,  // 背景音乐
    initialized: false,
    muted: false,
    bgMuted: false,  // 背景音乐是否静音

    // 初始化音频管理器
    init() {
        if (this.initialized) return;

        // 创建音频对象
        this.sounds = {
            start: new Audio('sounds/start.mp3'),
            eat: new Audio('sounds/eat.mp3'),
            gameover: new Audio('sounds/gameover.mp3')
        };
        
        // 创建背景音乐
        this.background = new Audio('sounds/background.mp3');
        this.background.loop = true;  // 循环播放
        this.background.volume = 0.4;  // 设置适当的音量

        // 设置音量
        this.sounds.start.volume = 0.7;
        this.sounds.eat.volume = 0.8;
        this.sounds.gameover.volume = 0.6;

        // 添加错误处理
        Object.keys(this.sounds).forEach(key => {
            const sound = this.sounds[key];
            
            // 添加错误事件监听器
            sound.addEventListener('error', (e) => {
                console.error(`音频 ${key} 加载失败:`, e);
                this._showAudioError(key, e);
            });

            // 预加载音频
            sound.load();
        });
        
        // 背景音乐错误处理
        this.background.addEventListener('error', (e) => {
            console.error('背景音乐加载失败:', e);
            this._showAudioError('background', e);
        });
        
        // 预加载背景音乐
        this.background.load();

        // 添加用户交互解锁音频
        this._setupAudioUnlock();
        
        this.initialized = true;
        console.log('音频管理器初始化完成');
    },

    // 播放指定音效
    play(soundName) {
        if (this.muted || !this.initialized) return;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.error(`音频 ${soundName} 不存在`);
            return;
        }

        // 重置播放位置并播放
        sound.currentTime = 0;
        
        // 使用 Promise 处理播放
        const playPromise = sound.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`音频 ${soundName} 播放失败:`, error);
                // 如果是因为用户交互限制，尝试解锁音频
                if (error.name === 'NotAllowedError') {
                    this._tryUnlockAudio();
                }
            });
        }
    },

    // 静音/取消静音所有音效
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    },
    
    // 静音/取消静音背景音乐
    toggleBgMute() {
        this.bgMuted = !this.bgMuted;
        
        if (this.bgMuted) {
            this.pauseBackground();
        } else {
            this.playBackground();
        }
        
        return this.bgMuted;
    },
    
    // 播放背景音乐
    playBackground() {
        if (this.bgMuted || !this.initialized) return;
        
        const playPromise = this.background.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('背景音乐播放失败:', error);
                // 如果是因为用户交互限制，尝试解锁音频
                if (error.name === 'NotAllowedError') {
                    this._tryUnlockAudio();
                }
            });
        }
    },
    
    // 暂停背景音乐
    pauseBackground() {
        if (this.background && !this.background.paused) {
            this.background.pause();
        }
    },
    
    // 设置背景音乐音量
    setBackgroundVolume(volume) {
        if (this.background) {
            // 确保音量在0-1之间
            this.background.volume = Math.max(0, Math.min(1, volume));
        }
    },

    // 设置用户交互解锁音频
    _setupAudioUnlock() {
        const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];
        const unlockAudio = () => {
            this._tryUnlockAudio();
            
            // 解锁后移除事件监听器
            unlockEvents.forEach(event => {
                document.removeEventListener(event, unlockAudio, true);
            });
        };

        // 添加事件监听器
        unlockEvents.forEach(event => {
            document.addEventListener(event, unlockAudio, true);
        });
        
        // 解锁背景音乐
        if (this.background) {
            // 创建一个静音的短暂播放来解锁音频
            this.background.volume = 0;
            const bgPlayPromise = this.background.play();
            
            if (bgPlayPromise !== undefined) {
                bgPlayPromise
                    .then(() => {
                        // 成功解锁，恢复音量并暂停
                        this.background.volume = 0.4;
                        this.background.pause();
                    })
                    .catch(error => {
                        console.warn('背景音乐解锁失败:', error);
                    });
            }
        }
    },

    // 尝试解锁音频
    _tryUnlockAudio() {
        // 解锁音效
        Object.keys(this.sounds).forEach(key => {
            const sound = this.sounds[key];
            
            // 创建一个静音的短暂播放来解锁音频
            sound.muted = true;
            sound.currentTime = 0;
            const playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        sound.pause();
                        sound.muted = false;
                        console.log(`音频 ${key} 已解锁`);
                    })
                    .catch(error => {
                        console.warn(`音频 ${key} 解锁失败:`, error);
                    });
            }
        });
        
        // 解锁背景音乐
        if (this.background) {
            // 创建一个静音的短暂播放来解锁音频
            this.background.volume = 0;
            const bgPlayPromise = this.background.play();
            
            if (bgPlayPromise !== undefined) {
                bgPlayPromise
                    .then(() => {
                        // 成功解锁，恢复音量并暂停
                        this.background.volume = 0.4;
                        this.background.pause();
                    })
                    .catch(error => {
                        console.warn('背景音乐解锁失败:', error);
                    });
            }
        }
    },

    // 显示音频错误信息
    _showAudioError(soundName, error) {
        // 检查音频文件是否存在
        const sound = this.sounds[soundName];
        if (sound && sound.error) {
            let errorMessage = '';
            switch (sound.error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    errorMessage = '音频加载已中止';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    errorMessage = '网络错误导致音频加载失败';
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    errorMessage = '音频解码错误';
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = `音频文件不存在或格式不支持: ${sound.src}`;
                    break;
                default:
                    errorMessage = '未知音频错误';
            }
            console.error(`${soundName} 音频错误: ${errorMessage}`);
        }
    }
};