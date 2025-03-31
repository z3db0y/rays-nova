declare global {
    interface Window {
        OffCliV: boolean;
        clientExit: HTMLDivElement;
        chatList: HTMLDivElement;
        windows: any[];
        closeClient(): void;
        getGameActivity(): any;
        showWindow(id: number): void;
        loginOrRegister(): void;
    }
}