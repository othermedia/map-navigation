// IMPORTANT - DO NOT REMOVE
if (window.GUnload) Ojay(window).on('unload', GUnload);
if (window.GMap2) JS.MethodChain.addMethods(GMap2);

/**
 * MapNavigation - a Google Maps navigational aid
 * ==============================================
 *
 * MapNavigation is a class that allows to you to unobtrusively create a Google Maps interface
 * from existing navigational items in an HTML document. Given a list of links containing hidden
 * geographic data, it will insert a map into the page that provides an alternate way of browsing
 * the list by loading the links' targets into the page using Ajax.
 *
 *
 * DEPENDENCIES
 *
 *      * Ojay, version 0.2.0 or greater
 *          - JS.Class, JS.Observable, JS.State
 *          - Ojay core, Ojay.HTTP
 *      * Google Maps API must be loaded before this script
 *
 *
 * HTML DOCUMENT STRUCTURE
 *
 * In terms of markup, all you need is an element containing some links, and each link should
 * contain some JSON-formatted data that is hidden using CSS. Here's an example:
 *
 *          <ul id='the-list'>
 *            <li>
 *              <a href='/service/tom.html'>
 *                the OTHER media
 *                <span class='geodata'>
 *                  {"lat": 51.498919, "lng": -0.080895}
 *                </span>
 *              </a>
 *            </li>
 *            <li>
 *              <a href='/service/rah.html'>
 *                Royal Albert Hall
 *                <span class='geodata'>
 *                  {"address": "London SW7 2AP"}
 *                </span>
 *              </a>
 *            </li>
 *            <li>
 *              <a class='news' href='/service/mps.html'>
 *                Parliament Sq.
 *                <span class='geodata'>
 *                  {"lat": 51.500514, "lng": -0.127497}
 *                </span>
 *              </a>
 *            </li>
 *          </ul>
 *
 * The basic pattern is that each link should point to the resource you want to load in with
 * Ajax, and it should contain a span with class 'geodata', which you can hide using a CSS rule.
 * Some of the links have a class name (e.g. 'news') which is used to add custom map markers
 * -- more on that later. The JSON data must contain either a pair of lat/lng co-ordinates, or
 * a textual address, which MapNavigation will use to geocode into a co-ordinate pair.
 *
 *
 * JAVASCRIPT IMPLEMENTATION
 *
 * With the other JavaScript dependencies and the markup in place, you create a map with the
 * following call:
 *
 *      var mapNav = MapNavigation.fromHTML('#the-list');
 *
 * This will crawl the element you specify ('#the-list') for links that contain geographic data.
 * It will then insert the following markup after your specified element:
 *
 *      <div class='map-navigation'>
 *          <div class='map-container'></div>
 *          <div class='map-display'></div>
 *      </div>
 *
 * 'map-container' will be used to host the Google map, and 'map-display' will be used to hold
 * content loaded in with Ajax. You can get a reference to the various elements by calling:
 *
 *      mapNav.getHTML()        // Returns an Ojay object for 'map-navigation' div
 *      mapNav.getDisplay()     // Returns an Ojay object for 'map-display' div
 *      mapNav.getGMap()        // Returns the Google Maps GMap2 object
 *
 * You can also change where the generated markup is placed in the document by calling:
 *
 *      // Place it after '#someElement'
 *      mapNav.install('after', '#someElement');
 *      
 *      // Place it at the bottom of an HTMLELement
 *      mapNav.install('bottom', anElementReference);
 *
 *
 * CUSTOM ICONS
 *
 * Notice that one of our links had the class name 'news'. We can register a custom icon for
 * displaying links with this name as follows. You just need to specify all the data needed
 * to construct a custom Google Maps icon:
 *
 *      MapNavigation.Icons.register('news', {
 *          image:              '/images/newsmarker.png',
 *          activeImage:        '/images/newsmarker-active.png',
 *          iconSize:           new GSize(22,34),
 *          iconAnchor:         new GPoint(11,33),
 *          infoWindowAnchor:   new GPoint(11,33),
 *          shadow:             '/images/marker-shad.png',
 *          shadowSize:         new GSize(49,36),
 *          transparent:        '/images/marker-trans.png',
 *          imageMap:           [3,0, 18,0, 20,1, 21,3, 21,14, 20,16, 18,17, 15,17,
 *                              11,32, 10,32, 6,17, 3,17, 1,16, 0,14, 0,3, 1,1]
 *      });
 *
 * The optional 'activeImage' setting specifies a different marker image to be used when the
 * selects that marker to view its linked content.
 *
 * Note that you must register any custom icons you want to use before calling MapNavigation.fromHTML.
 *
 *
 * LISTENING TO EVENTS
 *
 * MapNavigation object publish a number of events that you can use to add behaviour to them.
 * All event callbacks receive the MapNavigation instance as their first argument, with further
 * arguments depending on the type of event. All calls to on(), the event listner function,
 * return a MethodChain object that fires against the MapNavigation instance regsitering the
 * listener. For example, see the 'adjustlocation' event below.
 *
 * Event: 'ready'
 *
 * This allows you to add controls to the map (MapNavigation just creates a blank default map
 * interface, it's up to you to customize it to your needs.) For example:
 *
 *      mapNav.on('ready', function(map) {
 *          map.getGMap().addControl(new GSmallMapControl());
 *      });
 *
 * Event: 'addlocation'
 *
 * This is fired when a new location is added to the map. The callback is passed the MapNavigation
 * object and the new Location object. See the Location class for its API.
 *
 * Event: 'adjustlocation'
 *
 * This is fired when the position of a marker is changed, usually after a geocoding request
 * has been made. Here's an example of how MapNavigation itself corrects the field of view
 * after a geocoding request:
 *
 *      this.on('adjustlocation').fitToMarkers();
 *
 * Event: 'locationchange'
 *
 * This is fired when the user selects a new location to view, either from the map or from the
 * original links, and is fired after the associated 'pageload' event. The callback is passed
 * the MapNavigation instance, the old location and the new location (see the Location class
 * for details of its API). For example, here's the internal code that MapNavigation uses to
 * change marker icons:
 *
 *      this.on('locationchange', function(map, oldLoc, newLoc) {
 *          var marker = newLoc.getMarker(), icon = marker.getIcon();
 *          var active = icon.activeImage;
 *          if (active) marker.setImage(active);
 *          if (!oldLoc) return;
 *          marker = oldLoc.getMarker(), icon = marker.getIcon();
 *          marker.setImage(icon.image);
 *      });
 *
 * Event: 'pagerequest'
 *
 * This is fired when a request is made to load Ajax content, either when a marker is clicked
 * or when one of the original links is clicked. The callback is passed the MapNavigation
 * object and the requested URL. You can use this for tracking, or for UI changes, as detailed
 * under 'pageload'.
 *
 * Event: 'pageload'
 *
 * This is fired when a new Ajax content has finished loading. The callback is passed the
 * MapNavigation object and the requested URL. You can use this for tracking, or for UI changes,
 * for example let's fade the loaded content in:
 *
 *      mapNav.on('pagerequest', function(map, url) {
 *          map.getDisplay().setStyle({opacity: 0});
 *      });
 *      
 *      mapNav.on('pageload', function(map, url) {
 *          map.getDisplay().animate({opacity: {to: 1}}, 0.4);
 *      });
 *
 *
 * HISTORY MANAGEMENT
 *
 * MapNavigation is equipped for use with Ojay.History. It is set up to remember which URL is
 * currently displayed in the Ajax window, and will find the location corresponding to the
 * given URL. So, any active icons you're using will be activated by the history-managed object,
 * as the user uses the back button as well as navigating using links and markers. Just call
 * the following to manage a MapNavigation instance:
 *
 *      Ojay.History.manage(mapNav, 'mapview');
 *
 * @constructor
 * @class MapNavigation
 */
var MapNavigation = new JS.Class({
    include: [JS.State, Ojay.Observable],
    
    /**
     * If Google Maps cannot be used, sets state to INCOMPATIBLE, otherwise sets it to
     * INACTIVE. Sets up internal event listeners for location additions and changes.
     */
    initialize: function() {
        if (window.GBrowserIsCompatible === undefined || !GBrowserIsCompatible())
            return this.setState('INCOMPATIBLE');
        this.setState('INACTIVE');
        
        this.on('locationchange', function(map, oldLoc, newLoc) {
            var marker = newLoc.getMarker(), icon = marker.getIcon();
            var active = icon.activeImage;
            if (active) marker.setImage(active);
            if (!oldLoc) return;
            marker = oldLoc.getMarker(), icon = marker.getIcon();
            marker.setImage(icon.image);
        });
        
        this.on('adjustlocation').fitToMarkers();
    },
    
    /**
     * Returns the default state of the object for history manangement purposes.
     * @returns {Object}
     */
    getInitialState: function() {
        return {url: null};
    },
    
    /**
     * Handles changes of state that may be bookmarked and history managed.
     * @param {Object} state
     */
    changeState: function(state) {
        var location;
        if (location = this.findLocationByURL(state.url)) this.displayLocation(location);
    },
    
    /**
     * Returns an Ojay object wrapping the containing div for the whole map instance.
     * @returns {DomCollection}
     */
    getHTML: function() {
        this._elements = this._elements || {};
        var elements = this._elements, self = this;
        if (elements._container) return elements._container;
        return elements._container = Ojay( Ojay.HTML.div({className: self.klass.CONTAINER_CLASS}, function(HTML) {
            elements._map = Ojay( HTML.div({className: self.klass.MAP_CLASS}) );
            elements._display = Ojay( HTML.div({className: self.klass.DISPLAY_CLASS}) );
        }) );
    },
    
    /**
     * Returns an Ojay object wrapping the div that displays Ajax-loaded content.
     * @returns {DomCollection}
     */
    getDisplay: function() {
        return (this._elements||{})._display || Ojay();
    },
    
    /**
     * Inserts the container div into the document at the specified position relative
     * to the specified element.
     * @param {String} position
     * @param {String|HTMLElement|DomCollection} element
     */
    install: function(position, element) {
        if (this.inState('INCOMPATIBLE')) return;
        Ojay(element).insert(this.getHTML().node, position);
    },
    
    /**
     * Removes all existing markers from the map.
     */
    clear: function() {
    	this.getGMap().clearOverlays();
        this._locations = [];
    },
    
    /**
     * Takes a JSON string and replaces the current set of markers with the data
     * contained in the string.
     * @param {String} json
     */
    setContent: function(json) {
        this.clear();
        this.addLocationList(YAHOO.lang.JSON.parse(json).map(function(data) {
            return new this.klass.Location(data);
        }, this));
    },
        
    /**
     * Adds a new Location the the map interface.
     * @param {MapNavigation.Location}
     * @param {Function} callback
     * @param {Object} scope
     */
    addLocation: function(location, callback, scope) {
        if (this.inState('INCOMPATIBLE')) return;
        
        this._locations = this._locations || [];
        location.setMap(this);
        this._locations.push(location);
        
        GEvent.addListener(location.getMarker(), 'click', function() {
            // var map = this.getMap();
            // if (!map) return;
            // map.changeState({url: this.getURL()});
            if (this._bubbleText)
                return this.getMarker().openInfoWindow(this._bubbleText);
            Ojay.HTTP.GET(this.getURL(), {}, {
                onSuccess: function(response) {
                    this._bubbleText = response.responseText;
                    this.getMarker().openInfoWindow(this._bubbleText);
                }.bind(this)
            });
        }.bind(location));
                
        if (this._map) {
            if (location.hasLatLng()) {
                this._map.addOverlay(location.getMarker());
                this.fitToMarkers();
                if (callback) callback.call(scope || null);
            } else {
                location.on('locationfound', function(location) {
                    this._map.addOverlay(location.getMarker());
                    if (callback) callback.call(scope || null);
                }, this);
            }
            this.notifyObservers('addlocation', location);
        }
    },
    
    /**
     * @param {Array} locations
     */
    addLocationList: function(locations) {
        var callback = function() {
            var location = locations.shift(), state;
            if (!location) {
                state = this.getInitialState(), location;
                if (location = this.findLocationByURL(state.url)) this.displayLocation(location);
                return;
            } else {
                this.addLocation(location, function() {
                    setTimeout(callback.bind(this), 10);
                }, this);
            }
        };
        callback.call(this);
    },
    
    /**
     * Returns the Location object corresponding to the currently viewed location.
     * @returns {MapNavigation.Location}
     */
    getCurrentLocation: function() {
        return this._currentLocation || null;
    },
    
    /**
     * Returns the Location, if one exists, that corresponds to the given URL.
     * @param {String} url
     * @returns {MapNavigation.Location}
     */
    findLocationByURL: function(url) {
        this._locations = this._locations || [];
        return this._locations.filter(function(location) { return location.getURL() == url; })[0] || null;
    },
    
    /**
     * Returns a GLatLngBounds object that represents the smallest area that just contains
     * all the locations marked on the map.
     * @returns {GLatLngBounds}
     */
    getBounds: function() {
        if (this.inState('INCOMPATIBLE')) return null;
        if (!this._locations || !this._locations.length) return null;
        var bounds = this._locations.filter('hasLatLng').reduce(function(bounds, location) {
            if (location.ignore) return bounds;
            var latlng = location.getLatLng(), lat = latlng.lat(), lng = latlng.lng();
            if (bounds === null) return {n: lat, s: lat, e: lng, w: lng};
            if (lat > bounds.n) bounds.n = lat;
            if (lat < bounds.s) bounds.s = lat;
            if (lng > bounds.e) bounds.e = lng;
            if (lng < bounds.w) bounds.w = lng;
            return bounds;
        }, null);
        return bounds
                ? new GLatLngBounds(new GLatLng(bounds.s, bounds.w), new GLatLng(bounds.n, bounds.e))
                : null;
    },
    
    /**
     * Adjusts the map view for optimally viewing all the markers.
     */
    fitToMarkers: function() {
        var bounds = this.getBounds();
        if (bounds === null) return;
        var zoom = this._map.getBoundsZoomLevel(bounds);
        this._map.setCenter(bounds.getCenter(), zoom);
    },
    
    /**
     * Returns the GMap2 instance used by the object.
     * @returns {GMap2}
     */
    getGMap: function() {
        return this._map || null;
    },
    
    states: {
        /**
         * The map resides in the INCOMPATIBLE state if Google Maps is not available
         * or if the user's browser is not compatible with Google Maps.
         */
        INCOMPATIBLE: {},
        
        /**
         * The map resides in the INACTIVE state if Google Maps is available but the
         * map interface has not been initialized yet.
         */
        INACTIVE: {
            /**
             * Sets up the Google Maps instance, changes state to READY and fires 'ready' event.
             */
            activate: function() {
                this.getHTML();
                var region = this._elements._map.getRegion();
                var map = this._map = new GMap2(this._elements._map.node, {
                    size: new GSize(region.getWidth(), region.getHeight())
                });
                map.setCenter(new GLatLng(0,0), 1);
                this.setState('READY');
                this.notifyObservers('ready');
            }
        },
        
        /**
         * The map resides in the READY state when its map interface is created and
         * it is waiting for instructions.
         */
        READY: {
            /**
             * Loads the content for the given Location's URL into the display.
             * @param {MapNavigation.Location}
             */
            displayLocation: function(location) {
                var oldLocation = this._currentLocation || null;
                this._currentLocation = location;
                var url = location.getURL();
                if (!url) return;
                this.setState('REQUESTING');
                this.notifyObservers('pagerequest', url);
                Ojay.HTTP.GET(url, {}, {
                    onSuccess: function(response) {
                        response.insertInto(this._elements._display);
                        this.setState('READY');
                        this.notifyObservers('pageload', url);
                        this.notifyObservers('locationchange', oldLocation, location);
                    }.bind(this),
                    onFailure: function() {
                        this.setState('READY');
                    }.bind(this)
                });
            }
        },
        
        /**
         * The map resides in the REQUESTING state during Ajax calls for location links
         */
        REQUESTING: {}
    },
    
    extend: {
        CONTAINER_CLASS:    'map-navigation',
        MAP_CLASS:          'map-container',
        DISPLAY_CLASS:      'map-display',
        
        DEBUG: true,
        
        /**
         * Returns a MapNavigation instance generated by crawling the given element for links
         * containing geographic JSON data.
         * @param {String|HTMLElement|DomCollection}
         * @param {Function} filter
         * @returns {MapNavigation}
         */
        fromHTML: function(element, filter) {
            element = Ojay(element);
            var map = new MapNavigation();
            var locations = this.Location.fromHTML(element, filter);
            if (filter) locations.forEach(filter);
            map.install('after', element);
            map.wait(0.001)._(function() {
                this.activate();
                this.addLocationList(locations);
            });
            return map;
        },
        
        Geocoder: new GClientGeocoder(),
        
        /**
         * The MapNavigation.Location class is used to encapsulate data about a given location and
         * to effect UI changes when links or map markers are clicked. Each Location object contains
         * references to its HTML link and map marker object.
         * @constructor
         * @class MapNavigation.Location
         */
        Location: new JS.Class({
            include: Ojay.Observable,
            
            extend: {
                DATA_CLASS: 'geodata',
                
                /**
                 * Returns an array of Location objects generated by crawling an element for links
                 * containing geographic JSON data.
                 * @param {String|HTMLElement|DomCollection} element
                 * @param {Function} filter
                 * @returns {Array}
                 */
                fromHTML: function(element, filter) {
                    element = Ojay(element);
                    if (!element.node) return [];
                    return element.descendants('a').reduce(function(locations, link) {
                        var tag = link.children('.' + this.DATA_CLASS);
                        if (!tag.node) return locations;
                        var json = tag.node.innerHTML.stripTags(), data;
                        try { data = YAHOO.lang.JSON.parse(json); }
                        catch (e) { 
                            alert('Invalid JSON data: ' + json); data = {}; 
                        }
                        data.title = link.node.innerHTML.replace(json, '').stripTags();
                        data.href = link.node.href;
                        data.icon = link.node.className.trim();
                        locations.push(new this(data, link, filter));
                        return locations;
                    }.bind(this), []);
                }
            },
            
            /**
             * Registers event listeners for its HTML link (if there is one) and its map marker.
             * @param {Object} data
             * @param {DomCollection} link
             * @param {Function} filter
             */
            initialize: function(data, link, filter) {
                this._data = data || {};
                this._filter = filter;
                
                if (link) link.on('click', function(link, evnt) {
                    var map = this.getMap();
                    if (!map) return;
                    evnt.stopEvent();
                    map.changeState({url: this.getURL()});
                }, this);
            },
            
            /**
             * Associates the Location with a MapNavigation instance.
             * @param {MapNavigation} map
             */
            setMap: function(map) {
                this._map = map;
            },
            
            /**
             * Returns the associated MapNavigation instance.
             * @returns {MapNavigation}
             */
            getMap: function() {
                return this._map || null;
            },
            
            /**
             * Returns true iff the Location has known lat/lng co-ordinates.
             * @returns {Boolean}
             */
            hasLatLng: function() {
                return this._data.lat !== undefined && this._data.lng !== undefined;
            },
            
            /**
             * Returns the Location's position as a GLatLng. This result may be inaccurate if
             * the Location was specified with an address rather than co-ordinates. If the Location
             * is missing co-ordinates, it makes a Geocoding request and fires an 'adjustlocation'
             * event when its location has been discovered.
             * @returns {GLatLng}
             */
            getLatLng: function(callback, scope) {
                var data = this._data;
                if (!this.hasLatLng() && data.address && !this._unknownLocation)
                    MapNavigation.Geocoder.getLatLng(data.address, function(result) {
                        this.notifyObservers('locationfound');
                        if (!result) {
                            if (MapNavigation.DEBUG) alert('Address could not be geocoded: ' + data.address);
                            return this._unknownLocation = true;
                        }
                        data.lat = result.lat(); data.lng = result.lng();
                        this.getMarker().setLatLng(this.getLatLng());
                        this.getMap().notifyObservers('adjustlocation', this);
                    }.bind(this));
                
                if (!this._filtered && this._filter) {
                    this._filtered = true;
                    this._filter(this);
                }
                
                return new GLatLng(this._data.lat || 0, this._data.lng || 0);
            },
            
            /**
             * Returns the associated GMarker instance.
             * @returns {GMarker}
             */
            getMarker: function() {
                if (this._marker) return this._marker;
                var icon = MapNavigation.Icons.get(this._data.icon) || undefined;
                return this._marker = new GMarker(this.getLatLng(), icon);
            },
            
            /**
             * Returns the URL associated with the Location.
             * @returns {String}
             */
            getURL: function() {
                return this._data.href || null;
            }
        }),
        
        Icons: new JS.Singleton({
            /**
             */
            initialize: function() {
                this._icons = {};
            },
            
            /**
             * @param {String} name
             * @param {Object} settings
             */
            register: function(name, settings) {
                this._icons[name] = this.make(settings);
            },
            
            /**
             * @param {String} name
             * @returns {GIcon}
             */
            get: function(name) {
                return this._icons[name] || null;
            },
            
            /**
             * @param {Object} settings
             * @returns {GIcon}
             */
            make: function(settings) {
                var icon = new GIcon();
                JS.extend(icon, settings || {});
                return icon;
            }
        })
    }
});

