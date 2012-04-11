;(function( window ) {
  
  // ES5 Strict Mode
  'use strict'
  
  // References for better minification
  var document  = window.document
  var navigator = window.navigator
  var screen    = window.screen
  var storage   = window.localStorage
  
  // Avoid some extra Date() calls
  var NOW = (new Date).getTime()
  
  // UTILITIES ////////////////////////////////////////////////////////////////
  
  // VISITOR //////////////////////////////////////////////////////////////////
  
  function Visitor() {
    for( var i in modules ) {
      if( modules.hasOwnProperty( i ) ) {
        try {
          this[i] = modules[i]()
        } catch( error ) {
          this[i] = {
            error: error.message,
            stack: error.stack
          }
        }
      }
    }
  }
  
  // MODULES //////////////////////////////////////////////////////////////////
  
  var modules = {
    
  // //////////////////////////////////////////////////////////////////////////
    
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
    
  // //////////////////////////////////////////////////////////////////////////
    
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
        // Match identity & version
        match = navigator.userAgent.match( new RegExp(
          '(' + data[identity] + ')(?:(?:/| )([0-9._]*))?'
        ));
        // Retrieve versions for opera, safari, ...
        version = navigator.userAgent.match(
          /Version(?:\/| )([0-9._]*)/
        );
        // Get out of the loop
        if( match ) break;
      }
      
      function plugins() {
        if( !navigator.plugins ) return null;
        var checks = [ 'flash', 'silverlight', 'java', 'quicktime', 'reader', 'divx', 'vlc', 'real' ],
            result = {}, plugin, name;
        for( var i in checks ) {
          name = checks[i]; result[name] = 0;
          for( var j in navigator.plugins ) {
            plugin = navigator.plugins[j];
            if( plugin.name && ~plugin.name.toLowerCase().indexOf( name ) ) {
              result[name]++
              break;
            }
          }
        }
        return result;
      }
      
      return {
        name: identity,
        version: version && version[1] || match && match[2] || null,
        plugins: plugins()
      };
      
    },
    
  // //////////////////////////////////////////////////////////////////////////
    
    os: function() {
      
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
            // Apple has OS version numbers separated by underscores,
            // so we'll have to account for that strangeness
            version = version ? version.replace( /_/g, '.' ) : null;
            break;
          }
        }
        if( match ) break;
      }
      
      return {
        vendor: vendor || null,
        name: os || null,
        version: version || null
      }
      
    },
    
  // //////////////////////////////////////////////////////////////////////////
    
    screen: function() {
      return {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio || null
      }
    },
    
  // //////////////////////////////////////////////////////////////////////////
    
    viewport: function() {
      return {
        width: window.innerWidth || html.clientWidth || body.clientWidth || screen.availWidth,
        height: window.innerHeight || html.clientHeight || body.clientHeight || screen.availHeight,
        colorDepth: screen.colorDepth || screen.pixelDepth || null,
        iframe: top.location !== self.location
      }
    },
    
  // //////////////////////////////////////////////////////////////////////////
    
    device: function() {
      
      var html   = document.documentElement,
          body   = document.getElementsByTagName( 'body' )[0],
          tablet = !!navigator.userAgent.match( /(iPad|SCH-I800|xoom|kindle)/i ),
          phone  = !!navigator.userAgent.match (
            /(iPhone|iPod|blackberry|android 0.5|htc|lg|midp|mmp|mobile|nokia|opera mini|palm|pocket|psp|sgh|smartphone|symbian|treo mini|Playstation Portable|SonyEricsson|Samsung|MobileExplorer|PalmSource|Benq|Windows Phone|Windows Mobile|IEMobile|Windows CE|Nintendo Wii)/i
          );
      
      return {
        isTablet: tablet,
        isPhone: !tablet && phone,
        isMobile: tablet || phone
      }
      
    }
    
  }
  
  // JSON /////////////////////////////////////////////////////////////////////
  /*
  var JSON = {
    
    parse: ( window.JSON && window.JSON.parse ) || function( data ) {
      try { data = (new Function( 'return ' + data ))() }
      catch( error ) { return null }
      return data
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
    
  }
  */
  
  window.visitor = new Visitor
  
})( this );