declare global {
    interface Window {
        OffCliV: boolean;
        clientExit: HTMLDivElement;
        windows: any[];
        closeClient(): void;
        getGameActivity(): any;
        showWindow(id: number): void;
        loginAcc(): void;
    }
}