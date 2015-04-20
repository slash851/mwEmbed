
(function (mw, $) {
	"use strict";

	mw.PluginManager.add('qna', mw.KBasePlugin.extend({

		defaultConfig: {
			templatePath: '../QnA/resources/qna.tmpl.html',
			cssFileName: 'modules/QnA/resources/qna.css'
		},

		getBaseConfig: function() {
			var parentConfig = this._super();
			return $.extend({}, parentConfig, {
				qnaTargetId: null
			});
		},

		setup: function () {
			this.addBindings();
		},

		addBindings: function () {
			var _this = this;
			var embedPlayer = this.getPlayer();
            var qnaObject=null;
            var onVideoTogglePluginButton=null;

            var changeVideoToggleIcon=function() {

                if (!qnaObject.is(":visible")){
                    onVideoTogglePluginButton.removeClass('icon-qna-close');
                    onVideoTogglePluginButton.addClass('icon-qna-Ask');
                } else {
                    onVideoTogglePluginButton.removeClass('icon-qna-Ask');
                    onVideoTogglePluginButton.addClass('icon-qna-close');
                }

			this.bind('layoutBuildDone ended', function (event, screenName) {
				// add the Q&A toggle button to be on the video
				embedPlayer.getVideoHolder().append('<div class="qna-on-video-btn icon-qna-close"></div>');
				_this.getQnaContainer();
				// register to on click to change the icon of the toggle button
					_this.getQnaContainer();
						qnaObject.show();
					}
				})
			});

			this.bind('onOpenFullScreen', function() {
			});
			this.bind('onCloseFullScreen', function() {
			});
		},

		// Create a cue-point in the server for the question
		submitQuestion: function(question){
			var embedPlayer = this.getPlayer();
			var _this = this;

			var entryRequest = {
				"service": "cuePoint_cuePoint",
				"action": "add",
				"cuePoint:objectType": "KalturaAnnotation",
				"cuePoint:entryId": embedPlayer.kentryid,
				"cuePoint:startTime": embedPlayer.currentTime,
				"cuePoint:text": question,
				"cuePoint:tags": "qna"
			};

			_this.getKClient().doRequest(entryRequest, function (result) {
				mw.log("added Annotation cue point with id: " + result.id);
			},
			false,
			function(err){
				mw.log( "Error: "+ this.pluginName +" could not add cue point. Error: " + err );
			});
		},

		getKClient: function () {
			if (!this.kClient) {
				this.kClient = mw.kApiGetPartnerClient(this.embedPlayer.kwidgetid);
			}
			return this.kClient;
		},

		// load the Q&A template to the div with qnaTargetId
		getQnaContainer: function(){
			if (!this.$qnaListContainer) {
				// Inject external CSS file
				var cssLink = this.getConfig('cssFileName');
				if (cssLink) {
					cssLink = cssLink.toLowerCase().indexOf("http") === 0 ? cssLink : kWidget.getPath() + cssLink; // support external CSS links
					$( 'head', window.parent.document ).append( '<link type="text/css" rel="stylesheet" href="' + cssLink + '"/>' );
				} else {
					mw.log( "Error: "+ this.pluginName +" could not find CSS link" );
				}

				var iframeParent = window['parent'].document.getElementById( this.embedPlayer.id );
				$( iframeParent ).parent().find( "#" + this.getConfig( 'qnaTargetId' ) ).html( "<div class='qnaInterface'></div>" );
				this.$qnaListContainer = $( iframeParent ).parent().find( ".qnaInterface" );
				this.$qnaListContainer.append(this.getHTML());
				ko.applyBindings(new this.AppViewModel(this), this.$qnaListContainer[0]);

				this.bindButtons();
				this.positionOnVideoButton();
			}
			return this.$qnaListContainer;
		},

		positionOnVideoButton : function(){
			var onVideoTogglePluginButton = $('.qna-on-video-btn');
			var videoHeight = this.getPlayer().getVideoHolder().height();
			var buttonHeight = Math.round(videoHeight / 5);
			var buttonWidth = Math.round(videoHeight / 10);

			var borderRadius = buttonWidth + "px 0 0 " + buttonWidth + "px";

			var topOffset = (videoHeight-onVideoTogglePluginButton.height())/2 + "px";


			var textIndent = (buttonWidth - parseInt(onVideoTogglePluginButton.css('font-size'))) / 2;

		},

		bindButtons : function(){
			var _this = this;
			var parentWindowDocument = $( window['parent'].document );
			var sendButton = parentWindowDocument.find('.qnaSendButton');
			sendButton.text(gM('qna-send-button-text'));
			sendButton
				.off('click')
				.on('click', function(){
					var question = parentWindowDocument.find('.qnaQuestionTextArea').val();
					//if (_this.getPlayer().isOffline()){
					//	alert(gM('qna-cant-ask-while-not-live'));
					//} else {
						if (question !== gM('qna-default-question-box-text')) {
							_this.submitQuestion(question);
							_this.resetTextArea(textArea);
						}
					//}
				});
			var cancelButton = parentWindowDocument.find('.qnaCancelButton');
			cancelButton.text(gM('qna-cancel-button-text'));
			cancelButton
				.off('click')
				.on('click', function(){
					_this.resetTextArea(textArea);
				});

			var textArea = parentWindowDocument.find('.qnaQuestionTextArea');
			_this.resetTextArea(textArea);
			textArea
				.off('focus')
				.on('focus', function(){
					if (textArea.val() === gM('qna-default-question-box-text')) {
						textArea.css({'font-weight': 300});
						textArea.val('');
						textArea.css({'color': '#ffffff'});
					}
				});

			textArea
				.off('blur')
				.on('blur', function(){
					if (textArea.val() === '') {
						_this.resetTextArea(textArea);
					}
				});

			textArea.bind("mousewheel",function(ev) {
				ev.preventDefault();
				var scrollTop = $(this).scrollTop();
				$(this).scrollTop(scrollTop-Math.round(ev.originalEvent.deltaY));
			});
		},

		resetTextArea : function(textArea){
			textArea.val(gM('qna-default-question-box-text'));
			textArea.css({'font-weight': 300});
			textArea.css({'color': 'rgba(255, 240, 240, 0.61)'});
		},

		getHTML2 : function(){
			var txt = '<p>First name: <strong data-bind="text: firstName"></strong></p> <p>Last name: <strong data-bind="text: lastName"></strong></p>';
			return txt;
		},

		getHTML : function(data){
			var templatePath = this.getConfig( 'templatePath' );
			var rawHTML = window.kalturaIframePackageData.templates[ templatePath ];

			return rawHTML;

			//var transformedHTML = mw.util.tmpl( rawHTML );
			//transformedHTML = transformedHTML(data);
			//return transformedHTML;
		},

		// Get the Q&A data from the server.
		getQnaData : function(viewedThreads){

			var qnaEntryArray = [];
			qnaEntryArray.push( {
				threadId: "s9oa3cc",
				type: "announcement",
				title: gM('qna-announcement-title'),
				entryTitleClass: "qnaAnnouncementTitle",
				entryText:"All your bases are belong to us",
				entryTextClass: "qnaAnnouncementTitleClass",
				entryClass: viewedThreads.indexOf("s9oa3cc") > -1 ? "qnaAnnouncementRead" : "qnaAnnouncement"
			});
			// The below (commented out) is supposed to simulate a Q&A thread
			//qnaEntryArray[qnaEntryArray.length] = {
			//	threadId: "qyv78s1",
			//	type: "qna_thread",
			//	title: gM('qna-you-asked'),
			//	titleClass: "qnaThreadTitle",
			//	entryText: "gadol",
			//	entryClass: "qnaThread",
			//	qnalist: [
			//		{id: "d873j9", title:"aaa", text:"fdgfdgdfgsd sdf sf d"},
			//		{id: "i8a3xw", title:"aaa", text:"fdgfdgdfgsd sdf sf d"},
			//	]
			//};
			qnaEntryArray[qnaEntryArray.length] = {
				threadId: "qyv78a7",
				type: "announcement",
				title: gM('qna-announcement-title'),
				entryTitleClass: "qnaAnnouncementTitle",
				entryText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum a eros eu quam dictum sagittis. Nam sit amet odio turpis. Morbi mauris nisi, consequat et tortor a, vehicula pharetra sem. Nunc vitae lacus id sapien tristique pretium at non lorem. Integer venenatis lacus nec erat.",
				entryTextClass: "qnaAnnouncementTitleClass",
				entryClass: viewedThreads.indexOf("qyv78a7") > -1 ? "qnaAnnouncementRead" : "qnaAnnouncement"
			};
			qnaEntryArray[qnaEntryArray.length] = {
				threadId: "2dcdvcd",
				type: "announcement",
				title: gM('qna-announcement-title'),
				entryTitleClass: "qnaAnnouncementTitle",
				entryText:"This is a sample text for an announcement",
				entryTextClass: "qnaAnnouncementTitleClass",
				entryClass: viewedThreads.indexOf("2dcdvcd") > -1 ? "qnaAnnouncementRead" : "qnaAnnouncement"
			};
			qnaEntryArray[qnaEntryArray.length] = {
				threadId: "cch74vv",
				type: "announcement",
				title: gM('qna-announcement-title'),
				entryTitleClass: "qnaAnnouncementTitle",
				entryText:"just one more announcement...",
				entryTextClass: "qnaAnnouncementTitleClass",
				entryClass: viewedThreads.indexOf("cch74vv") > -1 ? "qnaAnnouncementRead" : "qnaAnnouncement"
			};

			return qnaEntryArray;
		},

		AppViewModel : function(plugin) {

			ko.observableArray.fn.refresh = function (item) {
				var index = this['indexOf'](item);
				if (index >= 0) {
					this.splice(index, 1);
					this.splice(index, 0, item);
				}
			};

			var _viewedThreads = [];
			if (localStorage["_viewedThreads"]) {
				_viewedThreads = JSON.parse(localStorage["_viewedThreads"]);
			}
			var _plugin = plugin;
			var _this = this;
			this.myObservableArray = ko.observableArray();

			this.numberOfClicks = ko.observable(0);

			_this.incrementClickCounter = function() {

				_this.myObservableArray.unshift(_plugin.getQnaData(_viewedThreads)[this.numberOfClicks() % _plugin.getQnaData(_viewedThreads).length]);

				var previousCount = this.numberOfClicks();
				this.numberOfClicks(previousCount + 1);
			};

			_this.itemRead = function(item, event) {
				console.log("item of type " + item.type + " with id " + item.threadId + " was clicked");

				// Write to localStorage this item was read
				if (_viewedThreads.indexOf(item.threadId) < 0 ) {
					_viewedThreads.push(item.threadId);
					localStorage["_viewedThreads"] = JSON.stringify(_viewedThreads);

					item.entryClass = "qnaAnnouncementRead";

					_this.myObservableArray[_this.myObservableArray.indexOf(item)] = item;
					_this.myObservableArray.refresh(item);
				}
			};
		}
	}));

})(window.mw, window.jQuery);
