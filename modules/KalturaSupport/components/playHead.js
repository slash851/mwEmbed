( function( mw, $ ) {"use strict";

	mw.PluginManager.define( 'playHead', mw.KBaseComponent.extend({
		defaultConfig: {
			'parent': 'controlBarContainer',
			'insertMode': 'firstChild',
			'order': 1
		},
		setup: function( embedPlayer ) {
			this.addBindings();
		},
		addBindings: function() {
			var _this = this;
			this.bind( 'monitorEvent', function(){
				// Update the playhead status: TODO move to layoutBuilder
				_this.getPlayer().updatePlayheadStatus();
				_this.getPlayer().updateBufferStatus();
			});
		},
		onEnable: function() {
			this.getComponent().slider( "option", "disabled", false );
		},
		onDisable: function() {
			this.getComponent().slider( "option", "disabled", true );
		},
        loadThumbnails : function() {
            if (!this.loadedThumb)  {
                this.loadedThumn = true;
                var baseThumbSettings = {
                    'partner_id': 1281471 ,//this.embedPlayer.evaluate( 'configProxy.kw.partnerId' ),
                    'uiconf_id': 15276472,//this.embedPlayer.evaluate('configProxy.kw.uiConfId'),
                    'entry_id': '1_0i2t7w0i',//this.embedPlayer.evaluate( 'mediaProxy.entry.id' ),
                    'width': 100
                }


                this.imageSlicesUrl = kWidget.getKalturaThumbUrl(
                    $.extend( {}, baseThumbSettings, {
                        'vid_slices': 100
                    })
                );

                // preload the image slices:
                (new Image()).src = this.imageSlicesUrl;
            }

        },

        showHover: function(data) {
              console.log(data);
            debugger;
            this.loadThumbnails();
            var sliderTop = 0;
            var sliderLeft = 0;
            var previewWidth = $(".sliderPreview").width()  ;
            var previewHeight = $(".sliderPreview").height();
            var top = $(".slider").position().top - previewHeight - 20;
            sliderLeft = data.x - previewWidth/2;
            if (data.x  < previewWidth /2)
            {
                sliderLeft =  0 ;
            }
            if (data.x > data.width - previewWidth/2)
            {
                sliderLeft = data.width - previewWidth ;
            }
            var perc = data.val / 1000;
            var currentTime = 141* perc;
           $(".sliderPreview").css({top:top,left:sliderLeft });
            $(".sliderPreview").css({

                'background-image': 'url(\'' + this.imageSlicesUrl + '\')',
                'background-position': kWidget.getThumbSpriteOffset( 100, currentTime  , 141),
                // fix aspect ratio on bad Kaltura API returns
                'background-size': ( 200 * kWidget.getSliceCount(100) ) + 'px 100%'
            });
            $(".sliderPreview").show();
        },
        clearHover: function() {
            $(".sliderPreview").hide();
        },
		getSliderConfig: function() {
			var _this = this;
			var embedPlayer = this.getPlayer();
			var ctrlObj = embedPlayer.layoutBuilder;
			return {
				range: "min",
				value: 0,
				min: 0,
				max: 1000,
				// we want less than monitor rate for smoth animation
				animate: mw.getConfig( 'EmbedPlayer.MonitorRate' ) - ( mw.getConfig( 'EmbedPlayer.MonitorRate' ) / 30 ) ,
				start: function( event, ui ) {
					var id = ( embedPlayer.pc != null ) ? embedPlayer.pc.pp.id:embedPlayer.id;
					embedPlayer.userSlide = true;
					// If playlist always start at 0
					embedPlayer.startTimeSec = ( embedPlayer.instanceOf == 'mvPlayList' ) ? 0:
									mw.npt2seconds( embedPlayer.getTimeRange().split( '/' )[0] );
				},
				slide: function( event, ui ) {
					var perc = ui.value / 1000;
					// always update the title 
					$( this ).find('.ui-slider-handle').attr('data-title', mw.seconds2npt( perc * embedPlayer.getDuration() ) );
					
					embedPlayer.jumpTime = mw.seconds2npt( parseFloat( parseFloat( embedPlayer.getDuration() ) * perc ) + embedPlayer.startTimeSec );
					// mw.log('perc:' + perc + ' * ' + embedPlayer.getDuration() + ' jt:'+ this.jumpTime);
					if ( _this.longTimeDisp ) {
						ctrlObj.setStatus( gM( 'mwe-embedplayer-seek_to', embedPlayer.jumpTime ) );
					} else {
						ctrlObj.setStatus( embedPlayer.jumpTime );
					}
					// Update the thumbnail / frame
					if ( embedPlayer.isPlaying == false ) {
						embedPlayer.updateThumbPerc( perc );
					}
				},
				change: function( event, ui ) {
					var perc = ui.value / 1000;
					// always update the title 
					$( this ).find('.ui-slider-handle').attr('data-title', mw.seconds2npt( perc * embedPlayer.getDuration() ) );
					// Only run the onChange event if done by a user slide
					// (otherwise it runs times it should not)
					if ( embedPlayer.userSlide ) {
						embedPlayer.userSlide = false;
						embedPlayer.seeking = true;

						// set seek time (in case we have to do a url seek)
						embedPlayer.seekTimeSec = mw.npt2seconds( embedPlayer.jumpTime, true );
						mw.log( 'PlayerLayoutBuilder:: seek to: ' + embedPlayer.jumpTime + ' perc:' + perc + ' sts:' + embedPlayer.seekTimeSec );
						ctrlObj.setStatus( gM( 'mwe-embedplayer-seeking' ) );
						if( embedPlayer.isStopped() ){
							embedPlayer.play();
						}
						embedPlayer.seek( perc );
					}
				}
			};
		},	
		getComponent: function() {
            var _this = this;
			if( !this.$el ) {
				this.$el = $( '<div />' ).addClass ( "playHead" ).slider( this.getSliderConfig())
                    .on({
                    mousemove: function(e) {
                        var width = $(this).width();
                        var offset = $(this).offset();
                        var options = $(this).slider('option');
                        var value = Math.round(((e.clientX - offset.left) / width) *
                            (options.max - options.min)) + options.min;

                        _this.showHover({
                            x: e.clientX,
                            val: value,
                            width:width
                        });
                    },mouseleave :function() {
                            _this.clearHover();
                        }
                }).append($("<div/>").addClass( "sliderPreview"));
				// Up the z-index of the default status indicator:
				this.$el.find( '.ui-slider-handle' ).attr('data-title', mw.seconds2npt( 0 ) );
				this.$el.find( '.ui-slider-range-min' ).addClass( 'watched' );
				// Add buffer and watched html:
				this.$el.append(
					$('<div />').addClass( "buffered")
				);

            }
			return this.$el;
		}
	})
	);
	
} )( window.mw, window.jQuery );