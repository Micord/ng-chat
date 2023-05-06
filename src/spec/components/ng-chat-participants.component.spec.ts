import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NgChatParticipantsComponent } from '../../ng-chat/components/ng-chat-participants/ng-chat-participants.component';
import { IChatParticipant } from '../../ng-chat/core/chat-participant';
import { ChatParticipantStatus } from '../../ng-chat/core/chat-participant-status.enum';
import { ChatUser } from '../../ng-chat/core/chat-user';

const participantStub: IChatParticipant = {
	id: 1,
	displayName: 'Test 1',
	status: ChatParticipantStatus.Online
}

describe('NgChatOptionsComponent', () => {
	let subject: NgChatParticipantsComponent;
	let fixture: ComponentFixture<NgChatParticipantsComponent>;

	beforeEach(waitForAsync(() => {
		TestBed.configureTestingModule({
			declarations: [ NgChatParticipantsComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(NgChatParticipantsComponent);
		subject = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('isUserSelectedFromParticipantsList exercise', () => {
        let mockedFirstUser = new ChatUser();
        let mockedSecondUser = new ChatUser();

        mockedFirstUser.id = 888;
        mockedSecondUser.id = 999;

        subject.selectedUsersFromParticipantsList = [mockedSecondUser];

        expect(subject.isUserSelectedFromParticipantsList(mockedFirstUser)).toBeFalsy();
        expect(subject.isUserSelectedFromParticipantsList(mockedSecondUser)).toBeTruthy();
	});

	it('Exercise participants filter', () => {
        subject.participants = [
			participantStub,
			{
				...participantStub,
				id: 2,
				displayName: 'Test 2'
			}
		];

        subject.searchInput = 'Test 1';

        const result = subject.filteredParticipants;

        expect(subject.participants.length).toBe(2);
        expect(result.length).toBe(1);
    });

    it('Exercise participants not found filter', () => {
        subject.participants = [
			participantStub,
			{
				...participantStub,
				id: 2,
				displayName: 'Test 2',
			}
		];

        subject.searchInput = 'Test 3';

        const result = subject.filteredParticipants;

        expect(subject.participants.length).toBe(2);
        expect(result.length).toBe(0);
	});

	it('On check participants list during options action should push selected user', () => {
        let mockedUser = new ChatUser();
        mockedUser.id = 999;

        subject.selectedUsersFromParticipantsList = [];

        subject.onParticipantsListCheckboxChange(mockedUser, true);

        expect(subject.selectedUsersFromParticipantsList).not.toBeNull();
        expect(subject.selectedUsersFromParticipantsList.length).toBe(1);
        expect(subject.selectedUsersFromParticipantsList[0]).toBe(mockedUser);
        expect(subject.selectedUsersFromParticipantsList[0].id).toBe(mockedUser.id);
    });

	it('On uncheck participants list during options action should remove selected user', () => {
        let mockedUser = new ChatUser();
        mockedUser.id = 999;

        subject.selectedUsersFromParticipantsList = [mockedUser];

        subject.onParticipantsListCheckboxChange(mockedUser, false);

        expect(subject.selectedUsersFromParticipantsList).not.toBeNull();
        expect(subject.selectedUsersFromParticipantsList.length).toBe(0);
    });
});
