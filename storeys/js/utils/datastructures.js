define(
    ['require'],
    function(require) {
        /**
         *A subclass of dictionary customized to handle multiple values for the
         *same key.

         *>>> var d = new MultiValueDict({'name': ['Adrian', 'Simon'], 'position': ['Developer']})
         *>>> d['name']
         *'Simon'
         *>>> d.getlist('name')
         *['Adrian', 'Simon']
         *>>> d.getlist('doesnotexist')
         *[]
         *>>> d.getlist('doesnotexist', ['Adrian', 'Simon'])
         *['Adrian', 'Simon']
         *>>> d.get('lastname', 'nonexistent')
         *'nonexistent'
         *>>> d.setlist('lastname', ['Holovaty', 'Willison'])

         *This class exists to solve the irritating problem raised by cgi.parse_qs,
         *which returns a list for every key, even though most Web forms submit
         *single name-value pairs.
         */
        function MultiValueDict(obj) {
            this.set = function(key, value){
                this[key] = (Array.isArray(value) ? value : [value]);
            }

            /**
            * Returns the last data value for the passed key. If key doesn't exist
            * or value is an empty list, then default is returned.
            */
            this.get = function(key, default_value){
                return (this[key] != undefined ? this[key][this[key].length-1] : default_value)
            }

            for (var prop in obj) this.set(prop, obj[prop]);
        }

        MultiValueDict.prototype.getlist = function(key, default_value){
            return ((this[key] != undefined) ? this[key] : default_value)
        }

        /**
        * update() extends rather than replaces existing key lists.
        */
        MultiValueDict.prototype.update = function(obj){
            for (var prop in obj) {
                if ( prop in this && this[prop].length != 0 ){
                    this[prop].concat_unique(Array.isArray(obj[prop]) ? obj[prop] : [obj[prop]])
                } else {
                    this.set(prop, obj[prop]);
                }
            }
        }

        Array.prototype.concat_unique = function(new_object) {
            for(var i=0; i<new_object.length; ++i) {
                var exists = false;
                for(var j=0; j<this.length; ++j) {
                    if(new_object[i] === this[j]){
                        exists = true;
                        break;
                    }
                }

                if (!exists)
                    this.push(new_object[i])
            }
        };

      return {
        MultiValueDict: MultiValueDict
      }
    }
);
