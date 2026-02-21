interface TelegramWebApp {
    ready: () => void
    expand: () => void
    enableClosingConfirmation: () => void
    disableVerticalSwipes: () => void
    HapticFeedback: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void
        selectionChanged: () => void
    }
    MainButton: {
        setText: (text: string) => void
        setParams: (params: { color?: string, text_color?: string, is_active?: boolean, is_visible?: boolean }) => void
        show: () => void
        hide: () => void
        enable: () => void
        disable: () => void
        showProgress: (leaveActive?: boolean) => void
        hideProgress: () => void
        onClick: (fn: () => void) => void
        offClick: (fn: () => void) => void
    }
    themeParams: {
        bg_color?: string
        text_color?: string
        hint_color?: string
        link_color?: string
        button_color?: string
        button_text_color?: string
        secondary_bg_color?: string
    }
    initData: string
    initDataUnsafe: any
    showAlert: (message: string, callback?: () => void) => void
    onEvent: (eventType: string, eventHandler: () => void) => void
    offEvent: (eventType: string, eventHandler: () => void) => void
    close: () => void
}

interface Window {
    Telegram?: {
        WebApp: TelegramWebApp
    }
}
