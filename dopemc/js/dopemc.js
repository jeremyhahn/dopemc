/**
 * Adobe AIR extensions. Creates custom methods on the air.NetConnection
 * object which the Flash Media Server can invoke.
 * 
 * @static
 */
air.NetConnection.prototype.onConnect = function( username, role, avatar ) {

	air.trace( "air.NetConnection.prototype.onConnect: Logged in user '" + username + "', role '" + role + "'." );

	DopeMC.user.username = username;
	DopeMC.user.role = role;
	DopeMC.user.avatar = avatar;

	air.trace( 'onConnect avatar: ' + avatar );
};

air.NativeApplication.nativeApplication.addEventListener( air.Event.EXITING, function( exitingEvent ) {

	  DopeMC.ui.logout();
});

/**
 * Client object that gets attached to Adobe AIR NetStream objects
 * which the Flash Media Server can invoke.
 */
var BattleClient = function() {

	BattleClient.prototype.onMetaData = function( info ) {

		air.trace( "metadata: duration=" + info.duration + " width=" + info.width + " height=" + info.height + " framerate=" + info.framerate );
    }

    BattleClient.prototype.onCuePoint = function( info ) {

        air.trace( "cuepoint: time=" + info.time + " name=" + info.name + " type=" + info.type );
    }

	BattleClient.prototype.onServerMessage = function( message ) {

		alert( 'server said: ' + message );
	}
}

/**
 * Base DopeMC JavaScript class
 * 
 * @static
 */
var DopeMC = {

	fmsURI : 'rtmp://fms.dopemc.com',
	webURI : 'http://beta.dopemc.com/index.php/AIRController/',
	applicationName : 'dopemc',
	participants : [],
	loggedIn : null,
	user : {
		username : null,
		password : null,
		role : null,
		subscription : null,  // free, silver, gold, platinum
		avatar : null,
		opponent : null,
		isBattling: false
	},
	connection: null,
	roomSO: null, // Flash Media Server SharedObject

	connect : function( room ) {

		roomURI = room.replace( /[ '"!@#$%^&*(){}~\/|><_=+-]/g, '' );

		var url = DopeMC.fmsURI + '/' + DopeMC.applicationName + '/' + roomURI;

		if( DopeMC.connection && DopeMC.connection.connected == true )
			DopeMC.connection.close();

		DopeMC.connection = new air.NetConnection();
		DopeMC.connection.addEventListener( air.NetStatusEvent.NET_STATUS, DopeMC.statusHandler );
		DopeMC.connection.addEventListener( air.SecurityErrorEvent.SECURITY_ERROR, DopeMC.securityErrorHandler );
		DopeMC.connection.connect( url, DopeMC.user.username, DopeMC.user.password, room );
	},

	disconnect : function() {

		if( DopeMC.connection && DopeMC.connection.connected == true )
			DopeMC.connection.close();

		DopeMC.user.isBattling = false;
	},

	statusHandler : function( event ) {

		switch( event.info.code ) {

			case "NetConnection.Connect.Success":

				air.trace( 'NetConnection.Connect.Success' );

				DopeMC.roomSO = air.SharedObject.getRemote( 'battleroom', DopeMC.connection.uri, false );
		 	 	DopeMC.roomSO.connect( DopeMC.connection );
				DopeMC.roomSO.addEventListener( 'sync', function( e ) {
		
						for( var i=0; i<e.changeList.length; i++ ) {

							 air.trace( 'sync event: ' + e.changeList[i].name );

							 switch( e.changeList[i].name ) {

									 case 'roomCount':
										  if( e.changeList[i].code == 'change' )
									 	  	  DopeMC.ui.battleroom.updateRoomCount();
									 break;

									 case 'chatMessage':
										  if( e.changeList[i].code == 'change' )
											  DopeMC.ui.battleroom.addChatMessage( e.target.data.chatMessage );
									 break;

									 case 'queueCount':
									 	  document.getElementById( 'battleroomQueueCount' ).innerHTML = 'Queue count: ' + e.target.data.queueCount;
									 break;

									 // Switch MC stream
									 case 'MC':

										  // Move old video off screen
										  var oldValue = e.changeList[i].oldValue; 
										  if( oldValue ) {

										  	  var p = DopeMC.getParticipant( oldValue );
											  if( p.video )
												  p.video.x = -1000;
										  }

										  // Play the new stream / video
									 	  if( e.target.data.MC == DopeMC.user.username ) {

											  var p = DopeMC.getParticipant( DopeMC.user.username );
										  	  if( !p ) {

											  	   p = new DopeMC.Participant(DopeMC.user.username, DopeMC.user.role );
												   DopeMC.participants.push( p );
											  }

											  // Stream is being switched to the logged in user
											  p.attachAudio();
										  	  p.attachVideo();
										  	  p.broadcast();

											  DopeMC.ui.battleroom.setPanelTitle( 'MC', DopeMC.user.username );
										  	  DopeMC.ui.battleroom.setAvatar( 'MC', DopeMC.user.avatar );
											  DopeMC.user.isBattling = true;
											  Ext.getCmp( 'mcSlider' ).enable();
										  }
										  else {

												  var p = DopeMC.getParticipant( e.target.data.MC );
											  	  if( !p ) {

												  	   p = new DopeMC.Participant( e.target.data.MC, 'MC' );
													   DopeMC.participants.push( p );
												  }

												  // Stream is being switched to a remote broadcaster
												  p.view( e.target.data.MC );

												  DopeMC.user.opponent = e.target.data.MC;
												  DopeMC.ui.battleroom.setPanelTitle( 'MC', DopeMC.user.opponent );
												  Ext.getCmp( 'mcSlider' ).disable();
										  }
									 break;

									 // Switch DJ stream
									 case 'DJ':

										 if( e.target.data.DJ == DopeMC.user.username ) {
		
											  var p = DopeMC.getParticipant( DopeMC.user.username );
										  	  if( !p ) {
		
											  	   p = new DopeMC.Participant(DopeMC.user.username, DopeMC.user.role );
												   DopeMC.participants.push( p );
											  }
		
											  // Stream is being switched to the logged in user
											  p.attachAudio();
										  	  p.attachVideo();
										  	  p.broadcast();

											  DopeMC.ui.battleroom.setPanelTitle( 'DJ', DopeMC.user.username );
										  	  DopeMC.ui.battleroom.setAvatar( 'DJ', DopeMC.user.avatar );
											  DopeMC.user.isBattling = true;

											  Ext.getCmp( 'djSlider' ).enable();
										  }
										  else {

												  // Stream is being switched to a remote broadcaster
												  var p = DopeMC.getParticipant( e.target.data.DJ );
											  	  if( !p ) {

												  	   p = new DopeMC.Participant( e.target.data.DJ, 'DJ' );
													   DopeMC.participants.push( p );
												  }
												  p.view( e.target.data.DJ );

												  DopeMC.ui.battleroom.setPanelTitle( 'DJ', e.target.data.DJ );
												  Ext.getCmp( 'djSlider' ).disable();
										  }
									 break;

									 case 'jukebox':
									 	  DopeMC.ui.battleroom.setAvatar( 'DJ', 'jukebox' );
									 break;

									 case 'round':
									 	  (e.target.data.round == 0) ?
										  	  document.getElementById( 'battleroomRoundCount' ).innerHTML = '' :
									 	  	  document.getElementById( 'battleroomRoundCount' ).innerHTML = 'Round: ' + e.target.data.round;
									 break;

									 case 'status':
									 	  document.getElementById( 'battleroomStatus' ).innerHTML = '<b>' + e.target.data.status + '</b>';
									 break;

									 case 'mcAvatar':
									 	  DopeMC.ui.battleroom.setAvatar( 'MC', e.target.data.mcAvatar );

										  var p = DopeMC.getParticipant( DopeMC.roomSO.data.MC );
										  if( p && !p.getAvatar() ) p.setAvatar( e.target.data.mcAvatar );
									 break;

									 case 'djAvatar':
									 	  DopeMC.ui.battleroom.setAvatar( 'DJ', e.target.data.djAvatar );

										  var p = DopeMC.getParticipant( DopeMC.roomSO.data.DJ );
										  if( p && !p.getAvatar() ) p.setAvatar( e.target.data.djAvatar );
									 break;

									 case 'votes':

										  // Clean up the battle streams and prompt clients to vote
										  if( e.target.data.votes == -1 ) {

											  for( var i = 0; i < DopeMC.participants.length; i++ ) {

													if( DopeMC.participants[i].broadcasting )
											  			DopeMC.participants[i].close();
											  }

											  DopeMC.ui.battleroom.vote();
											  DopeMC.user.isBattling = false;
										  }

										  else if( e.target.data.votes == 0 )
										      document.getElementById( 'battleroomVotes' ).innerHTML = '';

										  else if( e.target.data.votes > 0 )
										      document.getElementById( 'battleroomVotes' ).innerHTML = 'Total Votes: ' + e.target.data.votes;
											  
									 break;

									 default:
									 	air.trace( 'Unhandled sync event on SharedObject property: ' + e.changeList[i].name );
									 break;
							 }
						}
			 	});
				break;

			case "NetStream.Play.StreamNotFound":
				air.trace("Stream not found" );
				break;

			case "NetStream.Play.UnpublishNotify":
				air.trace('UnpublishNotify');
				break;

			case "NetStream.Play.PublishNotify":
				air.trace("Stream published");
				break;

			case "NetConnection.Connect.Closed":

				air.trace( 'NetConnection.Connect.Closed' );

				for( var i = 0; i < DopeMC.participants.length; i++ ) {

					if( DopeMC.participants[i].getUsername() == DopeMC.user.username ) {

						DopeMC.participants[i].getStream().close();
						DopeMC.participants.splice( i, 1 );						
					}
				}
				DopeMC.roomSO.clear();
				DopeMC.roomSO.close();
				DopeMC.ui.reset();
				break;

			case "NetConnection.Connect.Failed":

				Ext.Msg.show({
					title: 'Connection Failure',
					msg: 'The connection to the media server has failed. Attempt to reconnect?',
					buttons: Ext.Msg.YESNOCANCEL,
					fn: DopeMC.connect(),
					animEl: 'elId',
					icon: Ext.MessageBox.QUESTION
				});
				break;

			case "NetConnection.Connect.Rejected":
				DopeMC.ui.error( 'Connection rejected!' );
			break;

			default:
				air.trace('netStatusHandler unexpected code: ' + event.info.code);
		}
	},

	securityErrorHandler : function( event ) {

		air.trace( "DopeMC.Participant.securityErrorHandler() " + event );
    },

	/**
	 * Invokes the specified function once the DopeMC classes are loaded and ready for use.
	 * 
	 * @param {Object} func A function to execute when the window.onload event fires.
	 * @return void
	 */
	onReady : function( func ) {

		window.onload = func;
	},

	setLoggedIn : function( value ) {

		DopeMC.loggedIn = value;
	},

	isLoggedIn: function() {

		return DopeMC.loggedIn === true;
	},

	exit : function() { 

		var exitingEvent = new air.Event( air.Event.EXITING, false, true ); 
    	air.NativeApplication.nativeApplication.dispatchEvent( exitingEvent ); 

		if( !exitingEvent.isDefaultPrevented() ) {
			
			DopeMC.ui.logout();
			air.NativeApplication.nativeApplication.exit();
		}
	},

	/**
	 * Passes the specified argument to the Adobe AIR introspector
	 * 
	 * @param {Object} o The value to pass to the introspector
	 * @return void
	 */
	debug : function( o ) {

		air.Introspector.Console.log( o );
		//air.Introspector.Console.dump( o );
	},

	/**
	 * Returns a string indicating the current month, day, year, hours,
	 * minutes, seconds, and milliseconds.
	 * 
	 * @return A timestamp indicating the current date and time.
	 */
	getTimestamp : function() {

		var x = new Date();
		var y = x.getFullYear();
		var m = x.getMonth()+1;  // months start at 0
		var d = x.getDate();
		var h = x.getHours();
		var mi = x.getMinutes();
		var s = x.getSeconds();
		var ms = x.getMilliseconds();

		return m + d + y + h + mi + s + ms;
	},

	getParticipant : function( username ) {

		for( var i = 0; i < DopeMC.participants.length; i++ )
			if( DopeMC.participants[i].getUsername() == username ) 
				return DopeMC.participants[i];

		return false;
	},

	Participant : function( username, role ) {

		// Return existing users if they exist.
		if( DopeMC.getParticipant( username ) )
			return DopeMC.getParticipant( username );

		// Properties
		this.id = role.toLowerCase();
		this.username = username;
		this.role = role;
		this.avatar = null;
		this.stream = null;
		this.mic = null;
		this.cam = null;
		this.video = null;

		// Flags
		this.audioAttached = null;
		this.videoAttached = null;
		this.broadcasting = null;

		this.getId = function() {

			return this.id;
		};

		this.getUsername = function() {

			return this.username;
		};

		this.getRole = function() {

			 this.role;
		};

		this.setAvatar = function( avatar ) {

			 this.avatar = avatar;
		};

		this.getAvatar = function() {

			 return this.avatar;
		};
		
		this.getStream = function() {
			
			return this.stream;
		};

		this.getMic = function() {

			return this.mic;
		};
		
		this.getCam = function() {
			
			return this.cam;
		}
		
		this.getVideo = function() {
			
			return this.video;
		};

		this.createStream = function() {

			if( !this.stream ) {

				this.stream = new air.NetStream( DopeMC.connection );
				this.stream.addEventListener( air.NetStatusEvent.NET_STATUS, DopeMC.statusHandler );
				this.stream.client = new BattleClient();
			}
		};

		this.attachAudio = function() {

			 if( !this.stream ) this.createStream();

			 this.mic = air.Microphone.getMicrophone( -1 );
			 if( this.mic ) {

				 this.mic.setUseEchoSuppression( true );
				 this.stream.attachAudio( this.mic );

				 this.audioAttached = true;
			 }
		},

		this.attachVideo = function() {

			if( !this.stream ) this.createStream();

			this.cam = air.Camera.getCamera();
			if( this.cam ) {
			 	this.cam.setQuality( 144000, 85 );
				this.cam.setMode( 320, 240, 15 );
				this.cam.setKeyFrameInterval( 60 );

				this.video = new air.Video();
				this.video.attachCamera( this.cam );

				this.stream.attachCamera( this.cam );
				this.audioAttached = true;

				var extVideoPanel = Ext.get( this.id + 'Video' );
				var box = extVideoPanel.getBox();

				this.video.x = box.x + 1;
				this.video.y = box.y + 27;
				this.video.width = box.width;
				this.video.height = box.height - 26;

				window.htmlLoader.stage.addChild( this.video );
			}
		};

		this.broadcast = function( record ) {

			 if( !this.audioAttached ) { // Cams are not required but audio is

				DopeMC.ui.error( 'There was a problem attaching your microphone. Please verify your default microphone is working properly.' );
				this.disconnect();
				return false;
			 }

			 if( record )
			 	 this.stream.publish( this.username, 'record' );
			 else
			 	 this.stream.publish( this.username );

			 this.broadcasting = true;
		};

		this.view = function( streamName ) {

			 if( !this.stream ) this.createStream();

			 var extVideoPanel = Ext.get( this.id + 'Video' );
			 var box = extVideoPanel.getBox();

			 if( !this.video ) this.video = new air.Video();

			 this.video.x = box.x + 1;
			 this.video.y = box.y + 27;
			 this.video.width = box.width;
			 this.video.height = box.height - 26;

			 this.video.attachNetStream( this.stream );
			 this.stream.play( (streamName == null) ? this.username : streamName );

	         window.htmlLoader.stage.addChild( this.video );
		};

		this.close = function() {

			 this.stream.close();

			 if( this.video ) {

				this.video.clear();
			 	this.video.x = -1000;
			}
		},

		this.enterBattle = function() {

			 if( !DopeMC.connection )
			 	 DopeMC.ui.error( 'A connection to the server is required to enter a battle.' );

			 DopeMC.connection.call( 'enterBattle', null );
		};
	}
};