import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Tab, PageType } from '../types/Tab';

const STORAGE_KEY = 'tabStore';

const PAGE_TITLES: Record<PageType, string> = {
    landing: 'איתור',
    search: 'חיפוש',
    bookview: 'תצוגת ספר',
    pdfview: 'תצוגת PDF',
    settings: 'הגדרות',
    about: 'אודות'
};

export const useTabStore = defineStore('tabs', () => {
    const tabs = ref<Tab[]>([]);
    const nextId = ref<number>(2);

    const loadFromStorage = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                tabs.value = data.tabs || [];
                nextId.value = data.nextId || 2;
            }
        } catch (e) {
            console.error('Failed to load tabs from storage:', e);
        }
    };

    const saveToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                tabs: tabs.value,
                nextId: nextId.value
            }));
        } catch (e) {
            console.error('Failed to save tabs to storage:', e);
        }
    };

    loadFromStorage();
    if (tabs.value.length === 0) {
        tabs.value.push({
            id: 1,
            title: PAGE_TITLES.landing,
            isActive: true,
            currentPage: 'landing'
        });
    }

    watch(tabs, saveToStorage, { deep: true });
    watch(nextId, saveToStorage);

    const activeTab = computed(() => tabs.value.find(tab => tab.isActive));

    const addTab = () => {
        tabs.value.forEach(tab => tab.isActive = false);

        // Find the lowest available ID
        const existingIds = new Set(tabs.value.map(t => t.id));
        let newId = 1;
        while (existingIds.has(newId)) {
            newId++;
        }

        const newTab: Tab = {
            id: newId,
            title: PAGE_TITLES.landing,
            isActive: true,
            currentPage: 'landing'
        };
        tabs.value.push(newTab);

        // Update nextId to be at least one more than the highest ID
        nextId.value = Math.max(newId + 1, nextId.value);
    };

    const closeTab = () => {
        const currentIndex = tabs.value.findIndex(tab => tab.isActive);
        tabs.value = tabs.value.filter(tab => !tab.isActive);

        if (tabs.value.length === 0) {
            addTab();
        } else {
            const newIndex = Math.min(currentIndex, tabs.value.length - 1);
            const newTab = tabs.value[newIndex];
            if (newTab) {
                newTab.isActive = true;
            }
        }
    };

    const setActiveTab = (id: number) => {
        tabs.value.forEach(tab => {
            tab.isActive = tab.id === id;
        });
    };

    const resetTab = () => {
        const tab = tabs.value.find(t => t.isActive);
        if (tab) {
            tab.currentPage = 'landing';
            tab.title = PAGE_TITLES.landing;
            delete tab.bookState;
        }
    };

    const setPage = (pageType: PageType) => {
        const tab = tabs.value.find(t => t.isActive);
        if (tab) {
            tab.currentPage = pageType;
            tab.title = PAGE_TITLES[pageType];
        }
    };

    const openBookToc = (bookTitle: string, bookId: number, hasConnections?: boolean) => {
        const tab = tabs.value.find(t => t.isActive);
        if (tab) {
            // Open book if not already open
            if (tab.currentPage !== 'bookview' || tab.bookState?.bookId !== bookId) {
                openBook(bookTitle, bookId, hasConnections);
            }
            // Open TOC overlay
            if (tab.bookState) {
                tab.bookState.isTocOpen = true;
            }
        }
    };

    const closeToc = () => {
        const tab = tabs.value.find(t => t.isActive);
        if (tab?.bookState) {
            tab.bookState.isTocOpen = false;
        }
    };

    const openBook = (bookTitle: string, bookId: number, hasConnections?: boolean, initialLineIndex?: number) => {
        const tab = tabs.value.find(t => t.isActive);
        if (tab) {
            tab.currentPage = 'bookview';
            tab.title = bookTitle;

            // Create or update bookState
            if (!tab.bookState || tab.bookState.bookId !== bookId) {
                // New book - create fresh bookState
                tab.bookState = {
                    bookId,
                    bookTitle,
                    hasConnections,
                    initialLineIndex
                };
            } else {
                // Same book - update initialLineIndex if provided, otherwise clear it
                if (initialLineIndex !== undefined) {
                    tab.bookState.initialLineIndex = initialLineIndex;
                } else {
                    delete tab.bookState.initialLineIndex;
                }
            }
        }
    };

    const closeTabById = (id: number) => {
        const tab = tabs.value.find(t => t.id === id);
        if (tab?.isActive) {
            closeTab();
        } else {
            const currentActiveId = activeTab.value?.id;
            setActiveTab(id);
            closeTab();
            if (currentActiveId && tabs.value.find(t => t.id === currentActiveId)) {
                setActiveTab(currentActiveId);
            }
        }
    };

    const toggleSplitPane = () => {
        const tab = tabs.value.find(t => t.isActive);
        if (tab?.bookState) {
            tab.bookState.showBottomPane = !tab.bookState.showBottomPane;
        }
    };

    const openSettings = () => {
        // Check if settings tab already exists
        const existingSettingsTab = tabs.value.find(t => t.currentPage === 'settings');
        if (existingSettingsTab) {
            // Switch to existing settings tab
            setActiveTab(existingSettingsTab.id);
            return;
        }

        // Create new settings tab
        tabs.value.forEach(tab => tab.isActive = false);

        const existingIds = new Set(tabs.value.map(t => t.id));
        let newId = 1;
        while (existingIds.has(newId)) {
            newId++;
        }

        const newTab: Tab = {
            id: newId,
            title: PAGE_TITLES.settings,
            isActive: true,
            currentPage: 'settings'
        };
        tabs.value.push(newTab);
        nextId.value = Math.max(newId + 1, nextId.value);
    };

    const openAbout = () => {
        // Check if about tab already exists
        const existingAboutTab = tabs.value.find(t => t.currentPage === 'about');
        if (existingAboutTab) {
            // Switch to existing about tab
            setActiveTab(existingAboutTab.id);
            return;
        }

        // Create new about tab
        tabs.value.forEach(tab => tab.isActive = false);

        const existingIds = new Set(tabs.value.map(t => t.id));
        let newId = 1;
        while (existingIds.has(newId)) {
            newId++;
        }

        const newTab: Tab = {
            id: newId,
            title: PAGE_TITLES.about,
            isActive: true,
            currentPage: 'about'
        };
        tabs.value.push(newTab);
        nextId.value = Math.max(newId + 1, nextId.value);
    };

    return {
        tabs,
        activeTab,
        addTab,
        closeTab,
        closeTabById,
        setActiveTab,
        resetTab,
        setPage,
        openBookToc,
        closeToc,
        openBook,
        toggleSplitPane,
        openSettings,
        openAbout
    };
});
