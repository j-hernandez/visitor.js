/**
 * Visitor.js 0.1
 * (c) 2012 Jonas Hermsmeier
 * For details, see: https://github.com/jhermsmeier/visitor.js
 * Licensed under the MIT license.
 */
(function( window ) {
  
  'use strict';
  
  // references for better js compression
  var document     = window.document,
      navigator    = window.navigator,
      screen       = window.screen,
      localStorage = window.localStorage;
  
  var visitor = (function() {
    
    // changing the version invalidates
    // previously stored data
    var VERSION = 0.1;
    
    // avoid some extra date calls
    var NOW = new Date().getTime();
    
    // settings
    var options = {
      // location
      trackLocation: true,
      locationData: 'location',
      locationTimeout: 6,
      useGoogleLocation: true,
      useHTML5Location: false,
      // session
      sessionData: 'session',
      sessionTimeout: 32,
      // arrived hook
      arrived: null
    };
    
    // constructor
    function visitor() {
      // init vars
      var name, module,
          // map this over
          visitor = this,
          // number of asynchronos modules
          asyncModules = 0,
          // visitor state, ready when arrived
          checkArrival = function() {
            if( asyncModules === 0 && typeof options.arrived === 'function' )
              options.arrived( visitor );
          };
      // merge options
      if( window.visit && typeof window.visit === 'object' ) {
        for( name in window.visit )
          options[name] = window.visit[name];
      }
      // run modules
      for( name in modules ) {
        module = visitor[name] = modules[name]();
        if( typeof module === 'function' ) {
          try {
            module( function( data, property ) {
              visitor[property] = data;
              asyncModules--;
              checkArrival();
            }, name );
            asyncModules++;
          }
          catch( error ) {
            console.log( error.message );
          }
        }
      }
      // initial check
      checkArrival();
    }
    
    // modules
    var modules = {
      
      locale: function() {
        
        var lang = (
          navigator.language        ||
          navigator.browserLanguage ||
          navigator.systemLanguage  ||
          navigator.userLanguage
        ).toLowerCase().split( '-' );
        
        return {
          country: ( lang[1] || lang[0] ),
          language: lang[0]
        };
        
      },
      
      location: function() {
        if( options.trackLocation ) {
          
          var HTML5Location = function( callback, property ) {
            if( navigator.geolocation ) {
              navigator.geolocation.getCurrentPosition( function( position ) {
                callback( {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  address: null,
                  source: 'Client'
                }, property );
              }, function( error ) {
                GoogleLocation( callback, property );
              });
            } else {
              GoogleLocation( callback, property );
            }
          };
          
          var GoogleLocation = function( callback, property ) {
            var location = util.retrieveData( options.locationData );
            if( !location || location.source !== 'Google' ) {
              window.googleLocationReady = function() {
                if( window.google && window.google.loader && window.google.loader.ClientLocation ) {
                  // reference
                  var position = window.google.loader.ClientLocation;
                      position = {
                        latitude: position.latitude,
                        longitude: position.longitude,
                        accuracy: null,
                        address: {
                          city: position.address.city,
                          region: position.address.region,
                          country: position.address.country,
                          countryCode: position.address.country_code
                        },
                        source: 'Google'
                      };
                  // 
                  callback( position, property );
                  // 
                  util.storeData(
                    options.locationData,
                    position,
                    options.locationTimeout * 60 * 60 * 1000
                  );
                } else {
                  callback( null, property );
                }
              };
              util.loadScript( 'https://www.google.com/jsapi?callback=googleLocationReady' );
            } else {
              callback( location, property );
            }
          };
          
          if( options.useHTML5Location ) return HTML5Location;
          else if( options.useGoogleLocation ) return GoogleLocation;
          
        }
        return null;
      },
      
      timezone: function() {
        var A = new Date(); A.setMonth( 0 ); A.setDate( 1 );
        var B = new Date(); B.setMonth( 6 ); B.setDate( 1 );
        return {
          offset: new Date().getTimezoneOffset() / -60,
          dst: A.getTimezoneOffset() !== B.getTimezoneOffset()
        };
      },
      
      session: function() {
        
        var session = util.retrieveData( options.sessionData );
        
        var referrer = (function() {
          var data = {
                url: util.parseUrl( document.referrer || document.URL ),
                search: null
              },
              query = data.url.query || {},
              query = query.q || query.p || query.wd || null,
              engine = data.url.host.split( '.' ),
              engine = engine[ engine.length - 2 ];
          if( query ) {
            data.search = {
              engine: engine ? engine[0].toUpperCase() + engine.substr(1) : null,
              terms: query.split( ' ' )
            };
          }
          return data;
        })();
        
        if( session === null ) {
          session = {
            start: NOW,
            visits: 1,
            lastVisit: NOW,
            referrer: referrer
          };
        }
        else {
          session.lastVisit = NOW;
          session.referrer = referrer;
          session.visits++;
        }
        
        util.storeData(
          options.sessionData,
          session,
          options.sessionTimeout * 24 * 60 * 60 * 1000
        );
        
        return session;
      },
      
      browser: function() {
        
        var identity = null, match, version;
        
        var data = {
          'Chrome':             'Chrome',
          'OmniWeb':            'OmniWeb',
          'Safari':             'Apple',
          'iCab':               'iCab',
          'Konqueror':          'KDE',
          'Firefox':            'Firefox',
          'Camino':             'Camino',
          'Internet Explorer':  'MSIE',
          'Mozilla':            'Gecko',
          'Opera':              'Opera'
        };
        
        for( identity in data ) {
          // match identity & version
          match = navigator.userAgent.match( new RegExp(
            '(' + data[identity] + ')(?:(?:/| )([0-9._]*))?'
          ));
          // retrieve versions for opera, safari, ...
          version = navigator.userAgent.match(
            /Version(?:\/| )([0-9._]*)/
          );
          // get out of the loop
          if( match ) break;
        }
        
        function plugins() {
          if( !navigator.plugins ) return null;
          var checks = [ 'flash', 'silverlight', 'java', 'quicktime' ],
              result = {}, plugin, name;
          for( var i in checks ) {
            name = checks[i]; result[name] = false;
            for( var j in navigator.plugins ) {
              plugin = navigator.plugins[j];
              if( plugin.name && plugin.name.toLowerCase().indexOf( name ) !== -1 ) {
                result[name] = true; break;
              }
            }
          }
          return result;
        }
        
        return {
          // vendor: navigator.vendor || null,
          name: identity,
          version: version && version[1] || match && match[2] || null,
          plugins: plugins()
        };
        
      },
      
      device: function() {
        
        var data, vendor, os, match, version;
        
        data = {
          'Microsoft': {
            'Windows 8':       'Windows NT (6[.]2)',
            'Windows 7':       'Windows NT (6[.]1)',
            'Windows Vista':   'Windows NT (6[.]0)',
            'Windows XP':      'Windows NT (5[.](?:1|2))',
            'Windows Phone':   'Windows Phone OS',
            'Windows Mobile':  'Windows Mobile',
            'Windows CE':      'Windows CE'
          },
          'Apple': {
            'Mac Power PC': 'Mac PPC|PPC|Mac PowerPC|Mac_PowerPC',
            'Mac OS X':     'Mac OS X',
            'Mac iOS':      'iPod|iPad|iPhone',
            'Mac':          'Darwin|Macintosh|Power Macintosh|Mac OS'
          },
          'Google': {
            'Android': 'Android'
          },
          'Canonical': {
            'Kubuntu':  'Kubuntu',
            'Xubuntu':  'Xubuntu',
            'Edubuntu': 'Edubuntu',
            'Ubuntu':   'Ubuntu'
          },
          // TODO: categorize (vendor)
          'Other': {
            'Debian':     'Debian',
            'Fedora':     'Fedora',
            'CentOS':     'CentOS|Cent OS',
            'Linux Mint': 'Linux Mint',
            'openSUSE':   'openSUSE',
            'Linux':      'Linux',
            'Maemo':      'Maemo',
            'FreeBSD':    'FreeBSD',
            'NetBSD':     'NetBSD',
            'OpenBSD':    'OpenBSD',
            'Dragonfly':  'Dragonfly',
            'Syllable':   'Syllable'
          },
          'HP': {
            'webOS':   'webOS',
            'Palm OS': 'PalmOS|Palm OS'
          },
          'RIM': {
            'BlackBerry':    'BlackBerry',
            'RIM Tablet OS': 'RIM Tablet OS',
            'QNX':           'QNX'
          },
          'Accenture': {
            'Symbian OS': 'SymbOS|SymbianOS|Symbian OS'
          },
          'Samsung': {
            'bada': 'bada'
          },
          'Nintendo': {
            'Nintendo Wii': 'Nintendo Wii',
            'Nintendo DS':  'Nintendo DS',
            'Nintendo DSi': 'Nintendo DSi'
          },
          'Sony': {
            'Playstation Portable': 'Playstation Portable',
            'Playstation':          'Playstation'
          },
          'Oracle': {
            'Solaris': 'SunOS|Sun OS'
          }
        };
        
        for( vendor in data ) {
          for( os in data[vendor] ) {
            match = navigator.userAgent.match(
              new RegExp( data[vendor][os] + '(?:(?:/| )([0-9._]*))?', 'i' )
            );
            if( match ) {
              version = match[2] || match[1] || null;
              // apple has os version numbers separated by underscores,
              // so we'll have to account for that strange behavior
              version = version ? version.replace( /_/g, '.' ) : null;
              break;
            }
          }
          if( match ) break;
        }
        
        var html   = document.documentElement,
            body   = document.getElementsByTagName( 'body' )[0],
            tablet = !!navigator.userAgent.match( /(iPad|SCH-I800|xoom|kindle)/i ),
            phone  = !!navigator.userAgent.match (
              /(iPhone|iPod|blackberry|android 0.5|htc|lg|midp|mmp|mobile|nokia|opera mini|palm|pocket|psp|sgh|smartphone|symbian|treo mini|Playstation Portable|SonyEricsson|Samsung|MobileExplorer|PalmSource|Benq|Windows Phone|Windows Mobile|IEMobile|Windows CE|Nintendo Wii)/i
            );
        
        return {
          os: {
            vendor: vendor || null,
            name: os || null,
            version: version || null
          },
          screen: {
            width: screen.width,
            height: screen.height,
            pixelRatio: window.devicePixelRatio || null
          },
          viewport: {
            width: window.innerWidth || html.clientWidth || body.clientWidth || screen.availWidth,
            height: window.innerHeight || html.clientHeight || body.clientHeight || screen.availHeight,
            colorDepth: screen.colorDepth || screen.pixelDepth || null
          },
          isTablet: tablet,
          isPhone: !tablet && phone,
          isMobile: tablet || phone
        };
      }
      
    };
    
    // utilities
    var util = {
      
      parseUrl: function( url ) {
        var a = document.createElement( 'a' ),
            query = {}, queryString;
            a.href = url;
            queryString = a.search.substr( 1 );
        // parse query string
        if( queryString !== '' ) {
          var pairs = queryString.split( '&' ), parts;
          for( var i in pairs ) {
            parts = pairs[i].split( '=' );
            if( parts.length === 2 )
              query[parts[0]] = decodeURIComponent( parts[1] );
          }
        } else query = null;
        return {
          scheme: a.protocol.substr( 0, a.protocol.length - 1 ),
          host: a.host,
          port: a.port === '' ? 80 : a.port,
          path: a.pathname,
          query: query,
          fragment: a.hash || null
        };
      },
      
      setCookie: function( name, value, expires, path, domain, secure ) {
        if( !document.cookie || !name ) return false;
        if( !value ) expires = -1;
        if( expires ) expires = NOW + expires;
        return document.cookie = [
          encodeURIComponent( name ), '=',
          encodeURIComponent( "" + value ),
          expires ? '; expires=' + new Date( expires ).toGMTString() : '',
          path ? '; path=' + path : '',
          domain ? '; domain=' + domain : '',
          secure ? '; secure' : ''
        ].join( '' );
      },
      
      getCookie: function( name, result ) {
        if( !document.cookie ) return false;
        result = new RegExp( '(?:^|; )' + encodeURIComponent( name ) + '=([^;]*)' )
        result = result.exec( document.cookie );
        return result ? decodeURIComponent( result[1] ) : null;
      },
      
      storeData: function( key, value, expires ) {
        if( localStorage ) {
          localStorage[key] = value ?
            this.pack( value, expires ) :
            void 0;
        } else {
          this.setCookie( key, this.pack( value ), expires );
        }
      },
      
      retrieveData: function( key ) {
        if( localStorage && localStorage[key] ) {
          return this.unpack( localStorage[key] );
        } else {
          return this.unpack( this.getCookie( key ) );
        }
      },
      
      pack: function( object, expires ) {
        object.VERSION = VERSION;
        if( expires ) object.EXPIRES = NOW + expires;
        var string = JSON.stringify( object );
        delete object.VERSION;
        delete object.EXPIRES;
        return string;
      },
      
      unpack: function( string ) {
        var object = JSON.parse( string );
        if( object && object.VERSION === VERSION && object.EXPIRES > NOW ) {
          delete object.VERSION;
          delete object.EXPIRES;
          return object;
        }
        return null;
      },
      
      loadScript: function( url, script ) {
        script = document.createElement( 'script' );
        script.type = 'text/javascript';
        script.src  = url;
        document.getElementsByTagName( 'head' )[0].appendChild( script );
      }
      
    };
    
    // json
    var JSON = {
      
      parse: ( window.JSON && window.JSON.parse ) || function( string ) {
        if( typeof data !== 'string' || !data ) return null;
        return ( new Function( 'return ' + data ) )();
      },
      
      stringify: ( window.JSON && window.JSON.stringify ) || function( object ) {
        var type = typeof object;
        if( type !== 'object' || object === null ) {
          if( type === 'string' ) return '"' + object + '"';
        }
        else {
          var k, v, json = [], isArray = ( object.constructor === Array );
          for( k in object ) {
            v = object[k]; type = typeof v;
            if( type === 'string' ) v = '"'+v+'"';
            else if( type === 'object' && v !== null )
              v = this.stringify( v );
            json.push( ( isArray ? '' : '"'+k+'":' ) + v );
          }
          return(
            ( isArray ? '[' : '{' ) +
              json.join() +
            ( isArray ? ']' : '}' )
          );
        }
      }
      
    };
    
    return visitor;
    
  })();
  
  // Initialize
  window.visitor = new visitor();
  
})( this );