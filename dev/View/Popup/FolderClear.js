import { Notification } from 'Common/Enums';
import { i18n, getNotification } from 'Common/Translator';
import { setFolderHash } from 'Common/Cache';

import { MessageUserStore } from 'Stores/User/Message';

import Remote from 'Remote/User/Fetch';

import { decorateKoCommands } from 'Knoin/Knoin';
import { AbstractViewPopup } from 'Knoin/AbstractViews';

class FolderClearPopupView extends AbstractViewPopup {
	constructor() {
		super('FolderClear');

		this.addObservables({
			selectedFolder: null,
			clearingProcess: false,
			clearingError: ''
		});

		this.addComputables({
			folderFullNameForClear: () => {
				const folder = this.selectedFolder();
				return folder ? folder.printableFullName() : '';
			},

			folderNameForClear: () => {
				const folder = this.selectedFolder();
				return folder ? folder.localName() : '';
			},

			dangerDescHtml: () => i18n('POPUPS_CLEAR_FOLDER/DANGER_DESC_HTML_1', { 'FOLDER': this.folderNameForClear() })
		});

		decorateKoCommands(this, {
			clearCommand: self => {
					const folder = self.selectedFolder();
					return !self.clearingProcess() && null !== folder;
				}
		});
	}

	clearCommand() {
		const folderToClear = this.selectedFolder();
		if (folderToClear) {
			MessageUserStore.message(null);
			MessageUserStore.list([]);

			this.clearingProcess(true);

			folderToClear.messageCountAll(0);
			folderToClear.messageCountUnread(0);

			setFolderHash(folderToClear.fullNameRaw, '');

			Remote.folderClear((iError, data) => {
				this.clearingProcess(false);
				if (!iError && data && data.Result) {
					rl.app.reloadMessageList(true);
					this.cancelCommand();
				} else {
					if (data && data.ErrorCode) {
						this.clearingError(getNotification(data.ErrorCode));
					} else {
						this.clearingError(getNotification(Notification.MailServerError));
					}
				}
			}, folderToClear.fullNameRaw);
		}
	}

	clearPopup() {
		this.clearingProcess(false);
		this.selectedFolder(null);
	}

	onShow(folder) {
		this.clearPopup();
		if (folder) {
			this.selectedFolder(folder);
		}
	}
}

export { FolderClearPopupView, FolderClearPopupView as default };
