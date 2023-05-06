import { NgChat } from '../ng-chat/ng-chat.component';
import { ChatUser } from '../ng-chat/core/chat-user';
import { ParticipantResponse } from '../ng-chat/core/participant-response';
import { ChatWindow } from '../ng-chat/core/chat-window';
import { ChatAdapter } from '../ng-chat/core/chat-adapter';
import { Observable, of } from 'rxjs';
import { Message } from '../ng-chat/core/message';
import { MessageType } from '../ng-chat/core/message-type.enum';
import { Theme } from '../ng-chat/core/theme.enum';
import { IChatOption } from '../ng-chat/core/chat-option';
import { NgChatWindowComponent } from '../ng-chat/components/ng-chat-window/ng-chat-window.component';

class MockableAdapter extends ChatAdapter {
    public listParticipants(): Observable<ParticipantResponse[]> {
        throw new Error("Method not implemented.");
    }
    public getMessageHistory(destinataryId: any): Observable<Message[]> {
        throw new Error("Method not implemented.");
    }
    public sendMessage(message: Message): void {
        throw new Error("Method not implemented.");
    }
}

class MockableHTMLAudioElement {
    public play(): void { }
    public load(): void { }
}

// As "any" we allow private methods to be stubbed. Another option would be => spyOn<any>()
let subject: any = null;

describe('NgChat', () => {
    beforeEach(() => {
        subject = new NgChat(null); // HttpClient related methods are tested elsewhere
        subject.userId = 123;
        subject.adapter = new MockableAdapter();
        subject.audioFile = new MockableHTMLAudioElement();
    });

    it('Should have default title', () => {
        expect(subject.title).toBe('Participants');
    });

    it('Should have default message placeholder', () => {
        expect(subject.messagePlaceholder).toBe('Type a message');
    });

    it('Should have default participants search placeholder', () => {
        expect(subject.searchPlaceholder).toBe('Search');
    });

    it('Should have default polling interval', () => {
        expect(subject.pollingInterval).toBe(5000);
    });

    it('Must have history enabled by default', () => {
        expect(subject.historyEnabled).not.toBeFalsy();
    });

    it('Must have emojis enabled by default', () => {
        expect(subject.emojisEnabled).not.toBeFalsy();
    });

    it('Audio notification must be enabled by default', () => {
        expect(subject.audioEnabled).not.toBeFalsy();
    });

    it('Audio notification must have a default source', () => {
        expect(subject.audioSource).not.toBeUndefined();
    });

    it('Participants list search must be enabled by default', () => {
        expect(subject.searchEnabled).not.toBeFalsy();
    });

    it('Persistent windows state must be enabled by default', () => {
        expect(subject.persistWindowsState).toBeTruthy();
    });

    it('isCollapsed must be disabled by default', () => {
        expect(subject.isCollapsed).toBeFalsy();
    });

    it('maximizeWindowOnNewMessage must be enabled by default', () => {
        expect(subject.maximizeWindowOnNewMessage).toBeTruthy();
    });

    it('Must use current user id as part of the localStorageKey identifier', () => {
        expect(subject.localStorageKey).toBe(`ng-chat-users-${subject.userId}`);
    });

    it('Browser notifications must be enabled by default', () => {
        expect(subject.browserNotificationsEnabled).not.toBeFalsy();
    });

    it('Browser notifications must have a default source', () => {
        expect(subject.browserNotificationIconSource).not.toBeUndefined();
    });

    it('Browser notifications must not be bootstrapped before initialization', () => {
        expect(subject.browserNotificationsBootstrapped).toBeFalsy();
    });

    it('Browser notifications must have a default title', () => {
        expect(subject.browserNotificationTitle).toBe('New message from');
    });

    it('onParticipantClicked must have a default event emitter', () => {
        expect(subject.onParticipantClicked).toBeDefined();
    });

    it('onParticipantChatClosed must have a default event emitter', () => {
        expect(subject.onParticipantChatClosed).toBeDefined();
    });

    it('onParticipantChatClosed must have a default event emitter', () => {
        expect(subject.onParticipantChatClosed).toBeDefined();
    });

    it('File upload url must be undefined by default', () => {
        expect(subject.fileUploadAdapter).toBeUndefined();
    });

    it('Default theme must be Light', () => {
        expect(subject.theme).toBe(Theme.Light);
    });

    it('Custom theme must be undefined by default', () => {
        expect(subject.customTheme).toBeUndefined();
    });

    it('Must hide participants list when there is not enough viewport to display at least one chat window ', () => {
        subject.viewPortTotalArea = 400;

        expect(subject.windows.length).toBe(0);

        subject.windows = [
            new ChatWindow(null, false, false),
            new ChatWindow(null, false, false)
        ];

        subject.NormalizeWindows();

        expect(subject.windows.length).toBe(0);
    });

    it('Must invoke adapter on fetchParticipantsList', () => {
        spyOn(MockableAdapter.prototype, 'listParticipants').and.returnValue(of([]));

        subject.fetchParticipantsList(false);

        expect(MockableAdapter.prototype.listParticipants).toHaveBeenCalledTimes(1);
    });

    it('Must invoke restore windows state on fetchParticipantsList when bootstrapping', () => {
        spyOn(MockableAdapter.prototype, 'listParticipants').and.returnValue(of([]));
        spyOn(subject, 'restoreWindowsState');

        subject.fetchParticipantsList(true);

        expect(subject.restoreWindowsState).toHaveBeenCalledTimes(1);
    });

    it('Must not invoke restore windows state on fetchParticipantsList when not bootstrapping', () => {
        spyOn(MockableAdapter.prototype, 'listParticipants').and.returnValue(of([]));
        spyOn(subject, 'restoreWindowsState');

        subject.fetchParticipantsList(false);

        expect(subject.restoreWindowsState).not.toHaveBeenCalled();
    });

    it('Must update participants property when onParticipantsListChanged is invoked', () => {
        expect(subject.participantsResponse).toBeUndefined();

        subject.participantsInteractedWith = [new ChatUser()];

        subject.onParticipantsListChanged([
            new ParticipantResponse(),
            new ParticipantResponse()
        ]);

        expect(subject.participantsResponse.length).toBe(2);
        expect(subject.participants.length).toBe(2);
        expect(subject.participantsInteractedWith.length).toBe(0);
    });

    it('Must return existing open chat window when requesting a chat window instance', () => {
        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        subject.windows = [
            {
                participant: user
            }
        ];

        let result = subject.openChatWindow(user);

        expect(result).not.toBeUndefined();
        expect(result.length).toBe(2);
        expect(result[0]).not.toBeUndefined();
        expect(result[1]).toBeFalsy();
        expect(result[0].participant.id).toEqual(user.id);
        expect(result[0].participant.displayName).toEqual(user.displayName);
    });

    it('Must open a new window on a openChatWindow request when it is not opened yet', () => {
        subject.historyEnabled = false;

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        let result = subject.openChatWindow(user);

        expect(result).not.toBeUndefined();
        expect(result.length).toBe(2);
        expect(result[0]).not.toBeUndefined();
        expect(result[1]).not.toBeFalsy();
        expect(result[0].participant.id).toEqual(user.id);
        expect(result[0].participant.displayName).toEqual(user.displayName);
    });

    it('Must focus on the new window on a openChatWindow request when argument is supplied', () => {
        subject.historyEnabled = false;

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        spyOn(subject, 'focusOnWindow');

        let result = subject.openChatWindow(user, true);

        expect(result).not.toBeUndefined();
        expect(subject.focusOnWindow).toHaveBeenCalledTimes(1);
    });

    it('Must not focus on the new window on a openChatWindow request when argument is not supplied', () => {
        subject.historyEnabled = false;

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        spyOn(subject, 'focusOnWindow');

        let result = subject.openChatWindow(user);

        expect(result).not.toBeUndefined();
        expect(subject.focusOnWindow).not.toHaveBeenCalled();
    });

    it('Must load history from ChatAdapter when opening a window that is not yet opened', () => {
        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        spyOn(MockableAdapter.prototype, 'getMessageHistory').and.returnValue(of([]));

        let result = subject.openChatWindow(user);

        expect(result).not.toBeUndefined();
        expect(result.length).toBe(2);
        expect(result[0]).not.toBeUndefined();
        expect(result[1]).not.toBeFalsy();
        expect(result[0].participant.id).toEqual(user.id);
        expect(result[0].participant.displayName).toEqual(user.displayName);
        expect(MockableAdapter.prototype.getMessageHistory).toHaveBeenCalledTimes(1);
    });

    it('Mark messages as seen exercise', () => {
        let messages: Message[] = [{
            fromId: 1,
            message: 'Test',
            toId: 2
        },
        {
            fromId: 1,
            message: 'Test 2',
            toId: 2
        }]

        subject.markMessagesAsRead(messages);

        expect(messages.length).toBe(2);
        expect(messages[0].dateSeen).not.toBeUndefined();
        expect(messages[0].dateSeen.getTime()).toBeGreaterThan(new Date().getTime() - 60000);
        expect(messages[1].dateSeen).not.toBeUndefined();
        expect(messages[1].dateSeen.getTime()).toBeGreaterThan(new Date().getTime() - 60000);
    });

    it('Should play HTMLAudioElement when emitting a message sound on an unfocused window', () => {
        let window = new ChatWindow(null, false, false);

        spyOn(MockableHTMLAudioElement.prototype, 'play');

        subject.emitMessageSound(window);

        expect(MockableHTMLAudioElement.prototype.play).toHaveBeenCalledTimes(1);
    });

    it('Should not play HTMLAudioElement when emitting a message sound on a focused window', () => {
        let window = new ChatWindow(null, false, false);

        window.hasFocus = true;

        spyOn(MockableHTMLAudioElement.prototype, 'play');

        subject.emitMessageSound(window);

        expect(MockableHTMLAudioElement.prototype.play).not.toHaveBeenCalled();
    });

    it('Should not play HTMLAudioElement when audio notification is disabled', () => {
        let window = new ChatWindow(null, false, false);

        subject.audioEnabled = false;

        spyOn(MockableHTMLAudioElement.prototype, 'play');

        subject.emitMessageSound(window);

        expect(MockableHTMLAudioElement.prototype.play).not.toHaveBeenCalled();
    });

    it('Must invoke message notification method on new messages', () => {
        let message = new Message();
        let user = new ChatUser();

        spyOn(subject, 'emitMessageSound');
        spyOn(subject, 'openChatWindow').and.returnValue([null, true]);
        spyOn(subject, 'scrollChatWindow'); // Masking this call as we're not testing this part on this spec

        subject.onMessageReceived(user, message);

        expect(subject.emitMessageSound).toHaveBeenCalledTimes(1);
    });

    it('Must invoke message type assertion method on new messages', () => {
        let message = new Message();
        let user = new ChatUser();

        spyOn(subject, 'assertMessageType');

        // Masking these calls as we're not testing this part on this spec
        spyOn(subject, 'emitMessageSound');
        spyOn(subject, 'openChatWindow').and.returnValue([null, true]);
        spyOn(subject, 'scrollChatWindow');

        subject.onMessageReceived(user, message);

        expect(subject.assertMessageType).toHaveBeenCalledTimes(1);
    });

    it('Must mark message as seen on new messages if the current window has focus', () => {
        let message = new Message();
        let user = new ChatUser();
        let window = new ChatWindow(null, false, false);

        window.hasFocus = true;

        spyOn(subject, 'markMessagesAsRead');
        spyOn(subject, 'openChatWindow').and.returnValue([window, false]);
        spyOn(subject, 'scrollChatWindow'); // Masking this call as we're not testing this part on this spec
        spyOn(subject, 'emitMessageSound'); // Masking this call as we're not testing this part on this spec

        subject.onMessageReceived(user, message);

        expect(subject.markMessagesAsRead).toHaveBeenCalledTimes(1);
    });

    it('Must not mark message as seen on new messages if the current window does not have focus', () => {
        let message = new Message();
        let user = new ChatUser();
        let window = new ChatWindow(null, false, false);

        window.hasFocus = false;

        let eventSpy = spyOn(subject.onMessagesSeen, 'emit');

        spyOn(subject, 'markMessagesAsRead');
        spyOn(subject, 'openChatWindow').and.returnValue([window, false]);
        spyOn(subject, 'scrollChatWindow'); // Masking this call as we're not testing this part on this spec
        spyOn(subject, 'emitMessageSound'); // Masking this call as we're not testing this part on this spec

        subject.onMessageReceived(user, message);

        expect(subject.markMessagesAsRead).not.toHaveBeenCalled();
        expect(eventSpy).not.toHaveBeenCalled();
    });

    it('Should not use local storage persistency if persistWindowsState is disabled', () => {
        subject.persistWindowsState = false;

        spyOn(localStorage, 'setItem');

        expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('Update windows state exercise', () => {
        let persistedValue = null;

        spyOn(localStorage, 'setItem').and.callFake((key, value) => {
            persistedValue = value;
        });

        let firstUser = new ChatUser();
        let secondUser = new ChatUser();

        firstUser.id = 88;
        secondUser.id = 99;

        expect(localStorage.setItem).toHaveBeenCalledTimes(1);
        expect(persistedValue).toBe(JSON.stringify([88, 99]));
    });

    it('Should not restore windows state from local storage if persistWindowsState is disabled', () => {
        subject.persistWindowsState = false;

        spyOn(subject, 'openChatWindow');

        subject.restoreWindowsState();

        expect(subject.openChatWindow).not.toHaveBeenCalled();
    });

    it('Restore windows state exercise', () => {
        let firstUser = new ChatUser();
        let secondUser = new ChatUser();

        firstUser.id = 88;
        secondUser.id = 99;

        localStorage.setItem(subject.localStorageKey, JSON.stringify([firstUser.id, secondUser.id]));

        subject.participants = [firstUser, secondUser];
        let pushedParticipants = [];

        spyOn(subject, 'openChatWindow').and.callFake((participant) => {
            pushedParticipants.push(participant);
        });

        subject.restoreWindowsState();

        expect(subject.openChatWindow).toHaveBeenCalledTimes(2);
        expect(pushedParticipants).not.toBeNull();
        expect(pushedParticipants.length).toBe(2);
        expect(pushedParticipants[0]).toBe(firstUser);
        expect(pushedParticipants[1]).toBe(secondUser);
    });

    it('Must copy default text when a localization object was not supplied while initializing default text', () => {
        expect(subject.localization).toBeUndefined();

        subject.initializeDefaultText();

        expect(subject.localization).not.toBeUndefined();
        expect(subject.localization.title).toBe(subject.title);
        expect(subject.localization.searchPlaceholder).toBe(subject.searchPlaceholder);
        expect(subject.localization.messagePlaceholder).toBe(subject.messagePlaceholder);
        expect(subject.localization.statusDescription).toBe(subject.statusDescription);
        expect(subject.localization.browserNotificationTitle).toBe(subject.browserNotificationTitle);
    });

    it('Must not copy default text when a localization object was supplied while initializing default text', () => {
        subject.localization = {
            title: 'test 01',
            searchPlaceholder: 'test 02',
            messagePlaceholder: 'test 03',
            statusDescription: {
                online: 'test 04',
                busy: 'test 05',
                away: 'test 06',
                offline: 'test 07'
            },
            browserNotificationTitle: 'test 08',
            loadMessageHistoryPlaceholder: 'Load more messages'
        };

        subject.initializeDefaultText();

        expect(subject.localization).not.toBeUndefined();
        expect(subject.localization.title).not.toBe(subject.title);
        expect(subject.localization.searchPlaceholder).not.toBe(subject.searchPlaceholder);
        expect(subject.localization.messagePlaceholder).not.toBe(subject.messagePlaceholder);
        expect(subject.localization.statusDescription).not.toBe(subject.statusDescription);
        expect(subject.localization.browserNotificationTitle).not.toBe(subject.browserNotificationTitle);
        expect(subject.localization.loadMessageHistoryPlaceholder).not.toBe('Load older messages');
    });

    it('FocusOnWindow exercise', () => {
        subject.windows = [
            new ChatWindow(null, false, false),
            new ChatWindow(null, false, false),
            new ChatWindow(null, false, false)
        ];

        subject.chatWindows = {
            toArray: () => { }
        };

        let fakeChatInputs = [
            {
                chatWindowInput: {
                    nativeElement:
                    {
                        focus: () => { }
                    }
                }
            },
            {
                chatWindowInput: {
                    nativeElement:
                    {
                        focus: () => { }
                    }
                }
            },
            {
                chatWindowInput: {
                    nativeElement:
                    {
                        focus: () => { }
                    }
                }
            }
        ];

        spyOn(fakeChatInputs[1].chatWindowInput.nativeElement, 'focus');
        spyOn(subject.chatWindows, 'toArray').and.returnValue(fakeChatInputs);

        // @ts-ignore
        spyOn(window, 'setTimeout').and.callFake((fn) => {
            // @ts-ignore
            fn();
        });

        subject.focusOnWindow(subject.windows[1]);

        expect(fakeChatInputs[1].chatWindowInput.nativeElement.focus).toHaveBeenCalledTimes(1);
    });

    it('Must not focus on native element if a window is not found to focus when focusOnWindow is invoked', () => {
        subject.windows = [];

        subject.chatWindowInputs = {
            toArray: () => { }
        };

        subject.focusOnWindow(new ChatWindow(null, false, false));
    });

    it('GetClosestWindow must return next relative right chat window', () => {
        subject.windows = [
            new ChatWindow(null, false, false),
            new ChatWindow(null, false, false),
            new ChatWindow(null, false, false)
        ];

        let result = subject.getClosestWindow(subject.windows[2]);

        expect(result).toBe(subject.windows[1]);
    });

    it('GetClosestWindow must return previous chat window on 0 based index', () => {
        subject.windows = [
            new ChatWindow(null, false, false),
            new ChatWindow(null, false, false),
            new ChatWindow(null, false, false)
        ];

        let result = subject.getClosestWindow(subject.windows[0]);

        expect(result).toBe(subject.windows[1]);
    });

    it('GetClosestWindow must return undefined when there is only one chat window opened on the chat', () => {
        subject.windows = [
            new ChatWindow(null, false, false)
        ];

        let result = subject.getClosestWindow(subject.windows[0]);

        expect(result).toBe(undefined);
    });

    it('GetClosestWindow must return undefined when there is no open chat window on the chat', () => {
        subject.windows = [];

        let result = subject.getClosestWindow(new ChatWindow(null, false, false));

        expect(result).toBe(undefined);
    });

    it('Must bootstrap browser notifications when user permission is granted', async () => {
        subject.browserNotificationsBootstrapped = false;

        spyOn(Notification, 'requestPermission').and.returnValue(Promise.resolve("granted"));

        await subject.initializeBrowserNotifications();

        expect(subject.browserNotificationsBootstrapped).toBeTruthy();
        expect(Notification.requestPermission).toHaveBeenCalledTimes(1);
    });

    it('Must not bootstrap browser notifications when user permission is not granted', async () => {
        subject.browserNotificationsBootstrapped = false;

        spyOn(Notification, 'requestPermission').and.returnValue(Promise.resolve("denied"));

        await subject.initializeBrowserNotifications();

        expect(subject.browserNotificationsBootstrapped).toBeFalsy();
        expect(Notification.requestPermission).toHaveBeenCalledTimes(1);
    });

    it('Must invoke emitBrowserNotification on new messages', () => {
        let message = new Message();
        let user = new ChatUser();

        spyOn(subject, 'emitBrowserNotification');
        spyOn(subject, 'openChatWindow').and.returnValue([null, true]);
        spyOn(subject, 'scrollChatWindow'); // Masking this call as we're not testing this part on this spec
        spyOn(subject, 'emitMessageSound');  // Masking this call as we're not testing this part on this spec

        subject.onMessageReceived(user, message);

        expect(subject.emitBrowserNotification).toHaveBeenCalledTimes(1);
    });

    it('Must delegate message argument when invoking emitBrowserNotification on new messages', () => {
        let message = new Message();
        let argMessage = null;
        message.message = 'Test message';

        let user = new ChatUser();
        subject.historyEnabled = true;

        spyOn(subject, 'emitBrowserNotification').and.callFake((window, message) => {
            argMessage = message;
        });

        spyOn(subject, 'openChatWindow').and.returnValue([null, true]);
        spyOn(subject, 'emitMessageSound');  // Masking this call as we're not testing this part on this spec

        subject.onMessageReceived(user, message);

        expect(subject.emitBrowserNotification).toHaveBeenCalledTimes(1);
        expect(argMessage).toBe(message);
    });

    it('Must not invoke emitBrowserNotification when the maximizeWindowOnNewMessage setting is disabled', () => {
        let message = new Message();
        let user = new ChatUser();

        subject.maximizeWindowOnNewMessage = false;

        spyOn(subject, 'emitBrowserNotification');
        spyOn(subject, 'openChatWindow').and.returnValue([null, true]);
        spyOn(subject, 'scrollChatWindow'); // Masking this call as we're not testing this part on this spec
        spyOn(subject, 'emitMessageSound');  // Masking this call as we're not testing this part on this spec

        subject.onMessageReceived(user, message);

        expect(subject.emitBrowserNotification).not.toHaveBeenCalled();
    });

    it('Must invoke emitBrowserNotification when the maximizeWindowOnNewMessage setting is disabled but the window is maximized', () => {
        let message = new Message();
        let user = new ChatUser();
        let window = new ChatWindow(null, false, false);

        subject.maximizeWindowOnNewMessage = false;

        spyOn(subject, 'emitBrowserNotification');
        spyOn(subject, 'openChatWindow').and.returnValue([window, false]);
        spyOn(subject, 'scrollChatWindow'); // Masking this call as we're not testing this part on this spec
        spyOn(subject, 'emitMessageSound');  // Masking this call as we're not testing this part on this spec

        subject.onMessageReceived(user, message);

        expect(subject.emitBrowserNotification).toHaveBeenCalledTimes(1);
    });

    it('Must not invoke emitBrowserNotification when the maximizeWindowOnNewMessage setting is disabled and the window is collapsed', () => {
        let message = new Message();
        let user = new ChatUser();
        let window = new ChatWindow(null, false, true);

        subject.maximizeWindowOnNewMessage = false;

        spyOn(subject, 'emitBrowserNotification');
        spyOn(subject, 'openChatWindow').and.returnValue([window, false]);
        spyOn(subject, 'scrollChatWindow'); // Masking this call as we're not testing this part on this spec
        spyOn(subject, 'emitMessageSound');  // Masking this call as we're not testing this part on this spec

        subject.onMessageReceived(user, message);

        expect(subject.emitBrowserNotification).not.toHaveBeenCalled();
    });

    it('Must not invoke emitBrowserNotification when the maximizeWindowOnNewMessage setting is disabled and the window was freshly opened', () => {
        let message = new Message();
        let user = new ChatUser();
        let window = new ChatWindow(null, false, false);

        subject.maximizeWindowOnNewMessage = false;

        spyOn(subject, 'emitBrowserNotification');
        spyOn(subject, 'openChatWindow').and.returnValue([window, true]);
        spyOn(subject, 'scrollChatWindow'); // Masking this call as we're not testing this part on this spec
        spyOn(subject, 'emitMessageSound');  // Masking this call as we're not testing this part on this spec

        subject.onMessageReceived(user, message);

        expect(subject.emitBrowserNotification).not.toHaveBeenCalled();
    });

    it('Must invoke onParticipantChatOpened event when a chat window is open via user click', () => {
        subject.historyEnabled = false;
        subject.windows = [];

        spyOn(subject, 'focusOnWindow');

        let eventInvoked = false;
        let eventArgument = null;

        subject.onParticipantChatOpened.subscribe(e => {
            eventInvoked = true;
            eventArgument = e;
        });

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        subject.openChatWindow(user, false, true);

        expect(eventInvoked).toBeTruthy();
        expect(eventArgument).toBe(user);
    });

    it('Must not invoke onParticipantChatOpened event when a window is already open for the user', () => {
        subject.historyEnabled = false;

        let eventInvoked = false;
        let eventArgument = null;

        subject.onParticipantChatOpened.subscribe(e => {
            eventInvoked = true;
            eventArgument = e;
        });

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        subject.windows = [
            {
                participant: user
            }
        ];

        subject.openChatWindow(user, true, true);

        expect(eventInvoked).toBeFalsy();
        expect(eventArgument).toBe(null);
    });

    it('Must pop existing window when viewport does not have enough space for another window', () => {
        const user: ChatUser = {
            id: 777,
            displayName: 'Test user',
            status: 1,
        };

        const newUser: ChatUser = {
            id: 888,
            displayName: 'Test user 2',
            status: 1,
        };

        const userToBeRemoved: ChatUser = {
            id: 999,
            displayName: 'Test user 2',
            status: 1,
        };

        const remainingWindow = new ChatWindow(user, false, false);
        const windowToBeRemoved = new ChatWindow(userToBeRemoved, false, false);

        subject.viewPortTotalArea = 960;
        subject.historyEnabled = false;
        subject.windows = [
            remainingWindow,
            windowToBeRemoved
        ];

        spyOn(subject, 'focusOnWindow');

        subject.openChatWindow(newUser, false, true);

        expect(subject.windows.length).toBe(2);
        expect(subject.windows[0].participant).toBe(newUser);
        expect(subject.windows[1].participant).toBe(user);
    });

    it('Must push to viewport when participants list is disabled exercise', () => {
        const user: ChatUser = {
            id: 777,
            displayName: 'Test user',
            status: 1,
        };

        const newUser: ChatUser = {
            id: 888,
            displayName: 'Test user 2',
            status: 1,
        };

        const userThatWouldBeRemoved: ChatUser = {
            id: 999,
            displayName: 'Test user 2',
            status: 1,
        };

        const remainingWindow = new ChatWindow(user, false, false);
        const windowThatWouldBeRemoved = new ChatWindow(userThatWouldBeRemoved, false, false);

        subject.viewPortTotalArea = 961; // Would be enough for only 2 if the participants list was enabled. 1px more than window factor * 3
        subject.historyEnabled = false;
        subject.windows = [
            remainingWindow,
            windowThatWouldBeRemoved
        ];

        spyOn(subject, 'focusOnWindow');

        subject.openChatWindow(newUser, false, true);

        expect(subject.windows.length).toBe(3);
        expect(subject.windows[0].participant).toBe(newUser);
        expect(subject.windows[1].participant).toBe(user);
        expect(subject.windows[2].participant).toBe(userThatWouldBeRemoved);
    });

    it('Must invoke onParticipantChatClosed event when a window is closed', () => {
        const window = new ChatWindow({
            id: 999,
            displayName: 'Test user',
            status: 1,
        }, false, false);

        subject.windows = [window];

        let eventInvoked = false;
        let eventArgument = null;

        subject.onParticipantChatClosed.subscribe(e => {
            eventInvoked = true;
            eventArgument = e;
        });

        subject.closeWindow(subject.windows[0]);

        expect(eventInvoked).toBeTruthy();
        expect(eventArgument).toBe(window.participant);
    });

    it('Must not invoke onParticipantClicked event when a user is clicked on the friend list and the window is already open', () => {
        subject.historyEnabled = false;

        let eventInvoked = false;
        let eventArgument = null;

        subject.onParticipantClicked.subscribe(e => {
            eventInvoked = true;
            eventArgument = e;
        });

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        subject.windows = [
            {
                participant: user
            }
        ];

        subject.openChatWindow(user, true, true);

        expect(eventInvoked).toBeFalsy();
        expect(eventArgument).toBe(null);
    });

    it('Must not invoke onParticipantClicked event when a window is open but not triggered directly via user click', () => {
        subject.historyEnabled = false;

        let eventInvoked = false;
        let eventArgument = null;

        subject.onParticipantClicked.subscribe(e => {
            eventInvoked = true;
            eventArgument = e;
        });

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        subject.openChatWindow(user, true, false);

        expect(eventInvoked).toBeFalsy();
        expect(eventArgument).toBe(null);
    });

    it('Must invoke onParticipantClicked event when a user is clicked on the friend list', () => {
        subject.historyEnabled = false;
        subject.windows = [];

        let eventInvoked = false;
        let eventArgument = null;

        subject.onParticipantClicked.subscribe(e => {
            eventInvoked = true;
            eventArgument = e;
        });

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        subject.openChatWindow(user, true, true);

        expect(eventInvoked).toBeTruthy();
        expect(eventArgument).toBe(user);
    });

    it('Must invoke openChatWindow when triggerOpenChatWindow is invoked', () => {
        let spy = spyOn(subject, 'openChatWindow');

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        subject.triggerOpenChatWindow(user);

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args.length).toBe(1);
    });

    it('Must not invoke openChatWindow when triggerOpenChatWindow is invoked but user is undefined', () => {
        let spy = spyOn(subject, 'openChatWindow');

        subject.triggerOpenChatWindow(null);

        expect(spy).not.toHaveBeenCalled();
    });

    it('Must invoke onChatWindowClicked when triggerToggleChatWindowVisibility is invoked', () => {
        const currentUser = new ChatUser();
        currentUser.id = 1;

        const stubChatWindowComponent = new NgChatWindowComponent();

        subject.windows = [
            new ChatWindow(currentUser, false, false)
        ];

        spyOn(subject, 'getChatWindowComponentInstance').and.returnValue(stubChatWindowComponent);

        let spy = spyOn(stubChatWindowComponent, 'onChatWindowClicked');

        subject.triggerToggleChatWindowVisibility(currentUser.id);

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args.length).toBe(1);
        expect(spy.calls.mostRecent().args[0]).toBe(subject.windows[0]);
    });

    it('Must not invoke onChatWindowClicked when triggerToggleChatWindowVisibility is invoked but user is not found', () => {
        let spy = spyOn(NgChatWindowComponent.prototype, 'onChatWindowClicked');

        subject.windows = [];

        subject.triggerToggleChatWindowVisibility(1);

        expect(spy).not.toHaveBeenCalled();
    });

    it('Assert message type must default to text when no message type is defined in a message instance', () => {
        let nullMessageType = new Message();
        nullMessageType.type = null; // Overriding the default value

        let undefinedMessageType: Message = {
            fromId: 1,
            toId: 2,
            message: 'test'
        };

        let fileMessageType = new Message();
        fileMessageType.type = MessageType.File; // This must remain as it is

        subject.assertMessageType(nullMessageType);
        subject.assertMessageType(undefinedMessageType);
        subject.assertMessageType(fileMessageType);

        expect(nullMessageType.type).toBe(MessageType.Text);
        expect(undefinedMessageType.type).toBe(MessageType.Text);
        expect(fileMessageType.type).toBe(MessageType.File);
    });

    it('Must set theme to "Custom" if a custom theme URL is set', () => {
        subject.customTheme = "https://sample.test/custom-theme.css";

        subject.initializeTheme();

        expect(subject.theme).toBe(Theme.Custom);
    });

    it('Must throw Error on theme initialization if a unknown theme schema is set', () => {
        subject.theme = "invalid-theme";

        expect(() => subject.initializeTheme()).toThrow(new Error(`Invalid theme configuration for ng-chat. "${subject.theme}" is not a valid theme value.`));
    });

    it('onOptionPromptCanceled invoked should clear selection state', () => {
        let mockedUser = new ChatUser();
        mockedUser.id = 999;

        let mockedOption = {
            isActive: false,
            displayLabel: 'Test',
            action: null,
            validateContext: null
        } as IChatOption;

        subject.currentActiveOption = mockedOption;

        subject.onOptionPromptCanceled();

        expect(subject.currentActiveOption).toBeNull();
        expect(mockedOption.isActive).toBeFalsy();
    });
});
