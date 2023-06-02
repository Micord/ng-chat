import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Observable, of } from 'rxjs';
import { NgChatWindowComponent } from '../../ng-chat/components/ng-chat-window/ng-chat-window.component';
import { Chat } from '../../ng-chat/core/chat';
import { IChatParticipant } from '../../ng-chat/core/chat-participant';
import { ChatParticipantStatus } from '../../ng-chat/core/chat-participant-status.enum';
import { ChatUser } from '../../ng-chat/core/chat-user';
import { ChatWindow } from '../../ng-chat/core/chat-window';
import { FileMessage } from '../../ng-chat/core/file-message';
import { IFileUploadAdapter } from '../../ng-chat/core/file-upload-adapter';
import { Localization, StatusDescription } from '../../ng-chat/core/localization';
import { Message } from '../../ng-chat/core/message';
import { ScrollDirection } from '../../ng-chat/core/scroll-direction.enum';
import { EmojifyPipe } from '../../ng-chat/pipes/emojify.pipe';
import { LinkfyPipe } from '../../ng-chat/pipes/linkfy.pipe';

class MockableFileUploadAdapter implements IFileUploadAdapter {
    downloadFile(message: Message): void {
    }
    uploadFile(file: File, userTo: ChatUser): Observable<Message> {
        throw new Error("Method not implemented.");
    }
}

describe('NgChatWindowComponent', () => {
	let subject: NgChatWindowComponent;
	let fixture: ComponentFixture<NgChatWindowComponent>;

	beforeEach(waitForAsync(() => {
		TestBed.configureTestingModule({
      declarations: [ LinkfyPipe, EmojifyPipe, NgChatWindowComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(NgChatWindowComponent);
		subject = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('Must invoke onMessagesSeen event when a chat group window gets focus', () => {
        const spy = spyOn(subject.onMessagesSeen, 'emit');

        const user: ChatUser = {
            id: 888,
            displayName: 'Test user group',
            status: 1,
        };

        const messages: Message[] = [
            {
                fromId: 1,
                toId: 888,
                message:'Hi',
                dateSeen: new Date()
            },
            {
                fromId: 1,
                toId: 888,
                message:'Hi'
            }
        ];

        const window: ChatWindow = new ChatWindow(user, false, false);
        window.messages = messages;

        subject.toggleWindowFocus(window);

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args.length).toBe(1);
	});

	it('Must invoke onMessagesSeen event when a user window gets focus', () => {
		const currentUserId = 123;
		subject.userId = currentUserId;

        let spy = spyOn(subject.onMessagesSeen, 'emit');

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        let messages: Message[] = [
            {
                fromId: 999,
                toId: currentUserId,
                message:'Hi',
                dateSeen: new Date()
            },
            {
                fromId: 999,
                toId: currentUserId,
                message:'Hi'
            }
        ];

        let window: ChatWindow = new ChatWindow(user, false, false);
        window.messages = messages;

        subject.toggleWindowFocus(window);

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args.length).toBe(1);
    });

	it('Must send a new message when the ENTER key is pressed', () => {
        const chattingToUser = new ChatUser();
        const event = {
            keyCode: 13
        };

        chattingToUser.id = 99;

        const currentWindow = new ChatWindow(chattingToUser, false, false);

        currentWindow.newMessage = "Test";

		const scrollSpy = spyOn(subject, 'scrollChatWindow');
		const messageSentSpy = spyOn(subject.onMessageSent, 'emit');

        subject.onChatInputTyped(event, currentWindow);

        expect(currentWindow.newMessage).toBe(""); // Should clean the message input after dispatching the message
        expect(scrollSpy).toHaveBeenCalledTimes(1);
        expect(scrollSpy.calls.mostRecent().args[1]).toBe(ScrollDirection.Bottom);

		expect(messageSentSpy).toHaveBeenCalledTimes(1);
        expect(messageSentSpy.calls.mostRecent().args[0].message).toBe("Test");
    });

	it('Must not send a new message when the ENTER key is pressed but the message input is empty', () => {
        let chattingToUser = new ChatUser();
        let event = {
            keyCode: 13
        };

        chattingToUser.id = 99;

        let currentWindow = new ChatWindow(chattingToUser, false, false);

        currentWindow.newMessage = "";

		spyOn(subject, 'scrollChatWindow');
		const messageSentSpy = spyOn(subject.onMessageSent, 'emit');

        subject.onChatInputTyped(event, currentWindow);

        expect(messageSentSpy).not.toHaveBeenCalled();
        expect(subject.scrollChatWindow).not.toHaveBeenCalled();
    });

	it('Must not invoke onMessagesSeen event when a window gets focus but there are no new messages', () => {
        spyOn(subject.onMessagesSeen, 'emit');

        let user: ChatUser = {
            id: 999,
            displayName: 'Test user',
            status: 1,
        };

        // Both messages have "dateSeen" dates
        let messages: Message[] = [
            {
                fromId: 999,
                toId: 123,
                message:'Hi',
                dateSeen: new Date()
            },
            {
                fromId: 999,
                toId: 123,
                message:'Hi',
                dateSeen: new Date()
            }
        ];

        let window: ChatWindow = new ChatWindow(user, false, false);
        window.messages = messages;

        subject.toggleWindowFocus(window);

        expect(subject.onMessagesSeen.emit).not.toHaveBeenCalled();
	});

	it('Should filter by file instance id and upload file when a file upload "onFileChosen" event is triggered', () => {
        const mockedFileMessageServerResponse = new FileMessage();

        const chattingTo = new ChatUser();
        chattingTo.id = 88;

        const chatWindow = new ChatWindow(chattingTo, false, false);

        spyOn(MockableFileUploadAdapter.prototype, 'uploadFile').and.callFake(() => {
            // At this stage the 'isUploadingFile' should be true
            expect(subject.isUploadingFile(chatWindow)).toBeTruthy();

            return of(mockedFileMessageServerResponse);
        });

		const messageSentSpy = spyOn(subject.onMessageSent, 'emit');
        const scrollSpy = spyOn(subject, 'scrollChatWindow');

        const fakeFile = new File([''], 'filename', { type: 'text/html' });

        const fakeFileElement = {
            nativeElement:
            {
                id: `ng-chat-file-upload-${chattingTo.id}`,
                value: 'test',
                files: [fakeFile]
            }
        }

        // Should be filtered and ignored
        const anotherFakeFileElement = {
            nativeElement:
            {
                id: `ng-chat-file-upload-${123}`,
                value: 'test',
                files: []
            }
        }

        subject.nativeFileInput = fakeFileElement;
        subject.fileUploadAdapter = new MockableFileUploadAdapter();

        subject.onFileChosen(chatWindow);

        expect(MockableFileUploadAdapter.prototype.uploadFile).toHaveBeenCalledTimes(1);
        expect(MockableFileUploadAdapter.prototype.uploadFile).toHaveBeenCalledWith(fakeFile, chatWindow.participant.id);

        expect(messageSentSpy).toHaveBeenCalledTimes(1);
        expect(messageSentSpy.calls.mostRecent().args[0]).toBe(mockedFileMessageServerResponse);

        expect(mockedFileMessageServerResponse.fromId).toBe(subject.userId);
        expect(scrollSpy).toHaveBeenCalledTimes(1);
        expect(scrollSpy.calls.mostRecent().args[1]).toBe(ScrollDirection.Bottom);
        expect(fakeFileElement.nativeElement.value).toBe('');
        expect(anotherFakeFileElement.nativeElement.value).toBe('test');
        expect(subject.isUploadingFile(chatWindow)).toBeFalsy();
    });

    it('Must return default chat options exercise', () => {
        let chattingTo = new ChatUser();
        let currentWindow = new ChatWindow(chattingTo, false, false);

        let result = subject.defaultWindowOptions(currentWindow);

        expect(result).not.toBeNull();
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result[0].displayLabel).toBe("Delete messages");
        expect(result[0].action).not.toBeNull();
        expect(result[0].validateParticipantContext).not.toBeNull();

        expect(result[0].validateParticipantContext(chattingTo)).toBeTruthy();
        expect(result[0].validateParticipantContext(new Chat())).toBeFalsy();
    });

    it('Must return empty chat options when participant is not an user', () => {
        let chattingTo = new Chat();
        let currentWindow = new ChatWindow(chattingTo, false, false);

        let result = subject.defaultWindowOptions(currentWindow);

        expect(result).not.toBeNull();
        expect(result.length).toBe(0);
    });

    it('Must emit onLoadHistoryTriggered when fetchMessageHistory is invoked', () => {
        const spy = spyOn(subject.onLoadHistoryTriggered, 'emit');

        const user: ChatUser = {
            id: 888,
            displayName: 'Test user group',
            status: 1,
        };

        const window: ChatWindow = new ChatWindow(user, false, false);

        subject.fetchMessageHistory(window);

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.calls.mostRecent().args.length).toBe(1);
        expect(spy.calls.mostRecent().args[0]).toBe(window);
    });

    it('Avatar should not be displayed for messages sent by the current user', () => {
        subject.userId = 1;

        const user: ChatUser = {
            id: subject.userId,
            displayName: 'Test User',
            status: 1,
        };

        const window: ChatWindow = new ChatWindow(user, false, false);

        const message: Message = {
            fromId: user.id,
            toId: 123,
            message: 'Test'
        };

        const isVisible = subject.isAuthorNameVisible(window, message, 0);

        expect(isVisible).toBeFalse();
    });

    it('Avatar should be displayed for first messages sent by another user', () => {
        subject.userId = 1;

        const user: ChatUser = {
            id: 123,
            displayName: 'Test User',
            status: 1,
        };

        const window: ChatWindow = new ChatWindow(user, false, false);

        const message: Message = {
            fromId: user.id,
            toId: 123,
            message: 'Test'
        };

        const isVisible = subject.isAuthorNameVisible(window, message, 0);

        expect(isVisible).toBeTrue();
    });

    it('Avatar should be displayed for messages sent by another user if previous message wasn\'t from him', () => {
        subject.userId = 1;

        const user: ChatUser = {
            id: 123,
            displayName: 'Test User',
            status: 1,
        };

        const previousMessage: Message = {
            fromId: subject.userId,
            toId: user.id,
            message: 'Test'
        };

        const message: Message = {
            fromId: user.id,
            toId: subject.userId,
            message: 'Test'
        };

        const window: ChatWindow = new ChatWindow(user, false, false);

        window.messages.push(previousMessage)

        const isVisible = subject.isAuthorNameVisible(window, message, 1);

        expect(isVisible).toBeTrue();
    });

    it('Avatar should not be displayed for messages sent by another user if they are stacked', () => {
        subject.userId = 1;

        const user: ChatUser = {
            id: 123,
            displayName: 'Test User',
            status: 1,
        };

        const previousMessage: Message = {
            fromId: user.id,
            toId: subject.userId,
            message: 'Test'
        };

        const message: Message = {
            fromId: user.id,
            toId: subject.userId,
            message: 'Test'
        };

        const window: ChatWindow = new ChatWindow(user, false, false);

        window.messages.push(previousMessage)

        const isVisible = subject.isAuthorNameVisible(window, message, 1);

        expect(isVisible).toBeFalse();
    });

    it('An image message must be rendered ', () => {
        const statusDescriptionTestValues: StatusDescription = {
            online: 'Online',
            busy: 'Busy',
            away: 'Away',
            offline: 'Offline'
        };

        const localizationStub: Localization = {
            statusDescription: statusDescriptionTestValues,
            title: 'title',
            messagePlaceholder: 'messagePlaceholder',
            searchPlaceholder: 'searchPlaceholder',
            browserNotificationTitle: 'browserNotificationTitle',
            loadMessageHistoryPlaceholder: 'loadMessageHistoryPlaceholder'
        };
        const chatParticipantStatusDescriptor = (status: ChatParticipantStatus) => {
            const currentStatus = ChatParticipantStatus[status].toString().toLowerCase();
            return localizationStub.statusDescription[currentStatus];
        };

        const chattingToUser: IChatParticipant = {
            id: '1',
            status: ChatParticipantStatus.Online,
            displayName: 'name'
        };
        const imgUrl = 'https://66.media.tumblr.com/avatar_9dd9bb497b75_128.pnj';
        let message: Message = {
            fromId: 1,
            toId: 99,
            message:  imgUrl,
            type: 3
        }
        const currentWindow = new ChatWindow(chattingToUser, false, false);

        subject.chatParticipantStatusDescriptor = chatParticipantStatusDescriptor
        subject.localization = localizationStub;

        subject.chatWindow = currentWindow
        currentWindow.messages.push(message);

        fixture.detectChanges();
        let img = fixture.debugElement.query(By.css('.image-message'));
        expect(img.attributes['src']).toBe(imgUrl);
    });
});
