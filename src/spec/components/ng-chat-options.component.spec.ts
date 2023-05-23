import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NgChatOptionsComponent } from '../../ng-chat/components/ng-chat-options/ng-chat-options.component';
import { IChatOption } from '../../ng-chat/core/chat-option';
import { IChatParticipant } from '../../ng-chat/core/chat-participant';
import { ChatWindow } from '../../ng-chat/core/chat-window';

describe('NgChatOptionsComponent', () => {
	let component: NgChatOptionsComponent;
	let fixture: ComponentFixture<NgChatOptionsComponent>;

	beforeEach(waitForAsync(() => {
		TestBed.configureTestingModule({
			declarations: [ NgChatOptionsComponent ]
		})
		.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(NgChatOptionsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('Should invoke option action when option is clicked', () => {
		let actionInvoked = false;
		let actionInvokedArgument: ChatWindow = null;
		const mockedWindow = new ChatWindow(null, false, false);

		const option: IChatOption = {
			isActive: false,
			chattingTo: mockedWindow,
			validateParticipantContext: (participant: IChatParticipant) => !!participant,
			action: (participant: ChatWindow) => {
				actionInvoked = true;
				actionInvokedArgument = participant;
			},
			displayLabel: "Test Option"
		}

		component.onOptionClicked(option);

		expect(actionInvoked).toBeTruthy();
		expect(actionInvokedArgument).not.toBeNull();
		expect(actionInvokedArgument).toBe(mockedWindow);
		expect(option.isActive).toBeTruthy();
	});

	it('Should not invoke option action when option action is null or undefined', () => {
		let actionInvoked = false;
		let actionInvokedArgument: ChatWindow = null;
		const mockedWindow = new ChatWindow(null, false, false);

		const option: IChatOption = {
			isActive: false,
			chattingTo: mockedWindow,
			action: null,
			validateParticipantContext: null,
			displayLabel: "Test Option"
		}

		component.onOptionClicked(option);

		expect(actionInvoked).toBeFalsy();
		expect(actionInvokedArgument).toBeNull();
		expect(option.isActive).toBeTruthy();
	});
});
