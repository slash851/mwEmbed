/**
* Adds cue points support
*/
mw.KCuePoints = function( embedPlayer ){
	this.init( embedPlayer );
};
mw.KCuePoints.prototype = {
	init: function( embedPlayer ){
		this.embedPlayer = embedPlayer;
		this.addPlayerBindings();
	},
	/**
	 * Adds player cue point bindings
	 */
	addPlayerBindings: function(){
		var _this = this;
		// Get first cue point
		var nextCuePoint = this.getCuePoint(0);
		var embedPlayer = this.embedPlayer;
		
		// Handle first cue point (preRoll)
		if( nextCuePoint.startTime == 0 ) {
			nextCuePoint.startTime = 1;
		}

		// Bind to monitorEvent to trigger the cue points events
		$j( embedPlayer ).bind( 'monitorEvent.kCuePoints', function() {
			var currentTime = embedPlayer.currentTime * 1000;
			if( currentTime >= nextCuePoint.startTime ) {
				// Trigger the cue point
				_this.triggerCuePoint( nextCuePoint );

				// Get next cue point
				nextCuePoint = _this.getCuePoint( currentTime );
			}
		});

		// Handle last cue point (postRoll)
		$j( embedPlayer ).bind("ended.kCuePoints", function(){
			var cuePoints = _this.getCuePoints();
			var lastCuePoint = cuePoints[ cuePoints.length - 1];
			if( lastCuePoint.startTime >= _this.getEndTime() ) {
				// Found postRoll, trigger cuePoint
				_this.triggerCuePoint( lastCuePoint );
			}
		});

		// Bind for seeked event to update the nextCuePoint
		$j( embedPlayer ).bind("seeked.kCuePoints", function(){
			var currentTime = embedPlayer.currentTime * 1000;
			nextCuePoint = _this.getCuePoint(currentTime);
		});
	},
	getEndTime: function(){
		return this.embedPlayer.getDuration() * 1000;
	},
	getCuePoints: function(){
		if( ! this.embedPlayer.entryCuePoints || ! this.embedPlayer.entryCuePoints.length ){
			return false;
		}
		return this.embedPlayer.entryCuePoints;
	},
	/**
	* Returns the next cuePoint object for requested time
	* @param {Number} time Time in mili seconds
	*/
	getCuePoint: function( time ){
		// Check if embedPlayer has entryCuePoints
		if( ! this.getCuePoints() ){
			return false;
		}
		var cuePoints = this.getCuePoints();
		// Start looking for the cue point via time, return first match:
		for( var i = 0; i < cuePoints.length; i++ ) {
			cuePoint = cuePoints[ i ];
			if( cuePoint.startTime >= time ) {
				return cuePoint;
			}
		}
		// No cue point found in range return false:
		return false;
	},
	/**
	 * Triggers the given cue point
	 * @param (Object) Cue Point object
	 **/
	triggerCuePoint: function( cuePoint ) {
		/*
		 *  We need different events for each cue point type
		 *  TODO: will be changed according to the real type from the server
		 */
		var eventName;
		var obj = {
			cuePoint: cuePoint
		};
		if( cuePoint.type == 1 ) {
			// Code type cue point
			eventName = 'cuePointReached';
		} else if( cuePoint.type == 2 ) {
			// Ad type cue point
			eventName = 'adOpportunity';
			obj.context = this.getAdType(cuePoint);
		}
		$j( this.embedPlayer ).trigger( 'KalturaSupport_' + eventName, obj );
		mw.log('Cue Points :: Triggered event: ' + eventName + ' - ' + cuePoint.name + ' at: ' + cuePoint.startTime );
	},
	
	// Determine our cue point Ad type
	getAdType: function( cuePoint ) {
		if( cuePoint.startTime == 1 ) {
			return 'pre';
		} else if( cuePoint.startTime == this.getEndTime() ) {
			return 'post';
		} else {
			return 'mid';
		}
	}
	
};

/**
 * Add Embed Player binding for CuePoints
 */
$j( mw ).bind( 'newEmbedPlayerEvent', function( event, embedPlayer ){
	$j( embedPlayer ).bind( 'KalturaSupport_CheckUiConf', function( event, $uiConf, callback ){
		// Get Dummy Data from our test file
		// TODO: Should be removed when we have a working service
		if( mw.getConfig( 'Kaltura.TempCuePoints' ) ) {
			var entryCuePoints = mw.getConfig( 'Kaltura.TempCuePoints' );
		}

		// Add Entry Cue Points data
		if( entryCuePoints ) {
			mw.log( "KCuePoints:: Add CuePoints to embedPlayer");
			embedPlayer.entryCuePoints = entryCuePoints;
			new mw.KCuePoints( embedPlayer );
			
			// Allow other plugins to subscribe to cuePoint ready event: 
			$j( embedPlayer ).trigger( 'KalturaSupport_CuePointsReady', embedPlayer.entryCuePoints );
		}
		// Done adding Cue points return :
		callback();
	});
});