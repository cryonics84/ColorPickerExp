const proxy = function(originObject) {
    const handler = {
        get(target, property, receiver) {
            if (property === 'constructor') {
                return originObject.constructor;
            }

            try {
                return new Proxy(target[property], handler);
            } catch (err) {
                return Reflect.get(target, property, receiver);
            }
        },

        set(targetObj, prop, value) {
            //We do the changes before calling stateChanged, because if the property is being created,
            // then it won't exist for us to get its path.
            let changes = Reflect.set(...arguments);
            return changes;
        },

    };

    return new Proxy(originObject, handler);

};

export default proxy;