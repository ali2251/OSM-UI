const NETCONF_ERRORS = {
    'in-use' : {
        description: 'The request requires a resource that already is in use.'
    },
    'invalid-value' : {
        description: 'The request specifies an unacceptable value for one or more parameters.'
    },
    'too-big' : {
        description: 'The request or response (that would be generated) is too large for the implementation to handle.'
    },
    'missing-attribute' : {
        description: 'An expected attribute is missing.'
    },
    'bad-attribute' : {
        description: 'An attribute value is not correct; e.g., wrong type, out of range, pattern mismatch.'
    },
    'unknown-attribute' : {
        description: 'An unexpected attribute is present.'
    },
    'missing-element' : {
        description: 'An expected element is missing.'
    },
    'bad-element' : {
        description: 'An element value is not correct; e.g., wrong type, out of range, pattern mismatch.'
    },
    'unknown-element' : {
        description: 'An unexpected element is present.'
    },
    'unknown-namespace' : {
        description: 'An unexpected namespace is present.'
    },
    'access-denied' : {
        description: 'Access to the requested protocol operation or data model is denied because authorization failed.'
    },
    'lock-denied' : {
        description: 'Access to the requested lock is denied because the lock is currently held by another entity.'
    },
    'resource-denied' : {
        description: 'Request could not be completed because of insufficient resources.'
    },
    'rollback-failed' : {
        description: 'Request to roll back some configuration change (via rollback-on-error or <discard-changes> operations) was not completed for some reason.'
    },
    'data-exists' : {
        description: 'Request could not be completed because the relevant data model content already exists.  For example, a "create" operation was attempted on data that already exists.'
    },
    'data-missing' : {
        description: 'Request could not be completed because the relevant data model content does not exist.  For example, a "delete" operation was attempted on data that does not exist.'
    },
    'operation-not-supported' : {
        description: 'Request could not be completed because the requested operation is not supported by this implementation.'
    },
    'operation-failed' : {
        description: 'Request could not be completed because the requested operation failed for some reason not covered by any other error condition.'
    }
}

export default NETCONF_ERRORS;
