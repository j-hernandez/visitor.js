# Visitor.js

This originally started out only as a fork of [Iain Nash]'s [session.js].
In the meanwhile this fork has evolved to something more different
in regard to implementation and API.

[Iain Nash]: https://github.com/codejoust
[session.js]: https://github.com/codejoust/session.js

## Usage

```html
<script>
  // set options & hook up a callback
  visit = {
    useHTML5Location: false,
    useGoogleLocation: true,
    arrived: function( visitor ) {
      // async data has arrived
      // ATM only the location is async
    }
  };
</script>
<script src="visitor.js"></script>
<script>
  // all data is instantly available
  // (except location data)
</script>
```

## Options

- *bool* __trackLocation__: `true`  
  Specifies if the client location should be tracked at all.
  Disables all location methods, even if set to `true`.

- *string* __locationData__: `'location'`  
  Identifier of the location data cookie
  (or the localStorage key, respectively)

- *int* __locationTimeout__: `6`  
  Expiration of the cached location data in hours.

- *bool* __useGoogleLocation__: `true`  
  Use the Google JSAPI to determine the client location.

- *bool* __useHTML5Location__: `false`  
  Use the HTML5 API to determine the client location.

- *string* __sessionData__: `'session'`  
  Identifier of the session data cookie
  (or the localStorage key, respectively)

- *int* __sessionTimeout__: `32`  
  Expiration time of the cached session data in days.

- *function* __arrived__( *object* visitor ): `null`  
  Callback function. Gets called when the async data has
  been retrieved.


## Example dump

```javascript
{
  'locale': {
    'country': 'us',
    'language': 'en'
  },
  'location': {
    'latitude': 50.926999,
    'longitude': 11.587011,
    'accuracy': 25000,
    'address': null,
    'source': 'Client'
  },
  'timezone': {
    'offset': 1,
    'dst': true
  },
  'session': {
    'start': 1331025909715,
    'visits': 12,
    'lastVisit': 1331027691644,
    'referrer': {
      'url': {
        'scheme': 'http',
        'host': 'localhost',
        'port': 80,
        'path': '/example.html',
        'query': null,
        'fragment': null
      },
      'search': null
    }
  },
  'browser': {
    'name': 'Chrome',
    'version': '17.0.963.56',
    'plugins': {
      'flash': true,
      'silverlight': false,
      'java': false,
      'quicktime': false
    }
  },
  'device': {
    'os': {
      'vendor': 'Microsoft',
      'name': 'Windows 8',
      'version': '6.2'
    },
    'screen': {
      'width': 1920,
      'height': 1080,
      'pixelRatio': 1
    },
    'viewport': {
      'width': 1920,
      'height': 641,
      'colorDepth': 32
    },
    'isTablet': false,
    'isPhone': false,
    'isMobile': false
  }
}
```