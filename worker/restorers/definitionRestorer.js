const BPromise = require('bluebird');

const DefinitionModel = require('./models/definitionModel');

// compare the _v instead of time?
function restoreCreatedEvent(context, eventDefinition, eventCreatedAt) {
    BPromise.resolve()
        .then(() => {
            return DefinitionModel.readOne(
                context,
                eventDefinition.id
            );
        })
        .then(definition => {
            if (definition && (new Date(eventCreatedAt)).getTime() < (new Date(definition.createdAt)).getTime()) {
                return;
            }

            const updates = {};
            updates.UpdateExpression = `SET #createdAt = :createdAt`;
            updates.ExpressionAttributeNames = {
                '#createdAt': 'createdAt'

            };
            updates.ExpressionAttributeValues = {
                ':createdAt': eventCreatedAt
            };

            if (definition) {
                 updates.ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
                 updates.ExpressionAttributeValues[':updatedAt'] = definition.updatedAt;
                 updates.UpdateExpression = updates.UpdateExpression + ` DELETE #updatedAt :updatedAt`;
            }

            return DefinitionModel.update(
                context,
                eventDefinition,
                updates
            );
        });
}

function restoreUpdatedEvent(context, eventDefinition, eventUpdatedAt, eventCreatedAt) {
    BPromise.resolve()
        .then(() => {
            return DefinitionModel.readOne(
                context,
                eventDefinition.id
            );
        })
        .then(definition => {
            if (definition && (new Date(eventUpdatedAt)).getTime() < (new Date(definition.updatedAt)).getTime()) {
                return;
            }

            const updates = {};
            updates.UpdateExpression = `SET #updatedAt = :updatedAt, #createdAt = :createdAt`;
            updates.ExpressionAttributeNames = {
                '#updatedAt': 'updatedAt',
                '#createdAt': 'createdAt'
            };
            updates.ExpressionAttributeValues = {
                ':updatedAt': eventUpdatedAt,
                ':createdAt': eventCreatedAt
            };

            return DefinitionModel.update(
                context,
                eventDefinition,
                updates
            );
        });
}

function restoreDeletedEvent(context, eventDefinition, eventUpdatedAt, eventCreatedAt) {
    BPromise.resolve()
        .then(() => {
            return DefinitionModel.readOne(
                context,
                eventDefinition.id
            );
        })
        .then(definition => {
            if (definition && definition.dateDeleted && (new Date(eventUpdatedAt)).getTime() < (new Date(value.dateDeleted)).getTime()) {
                return;
            }

            const updates = {};
            updates.UpdateExpression = `SET #updatedAt = :updatedAt, #createdAt = :createdAt`;
            updates.ExpressionAttributeNames = {
                '#updatedAt': 'updatedAt',
                '#createdAt': 'createdAt'
            };
            updates.ExpressionAttributeValues = {
                ':updatedAt': eventUpdatedAt,
                ':createdAt': eventCreatedAt
            };

            eventDefinition.dateDeleted = eventUpdatedAt;
            return ValueModel.delete(
                context,
                eventDefinition,
                updates
            );
        });
}

function restoreEvent(context, event) {
    const eventDefinition = {
        id: event.EventBody.object.Id,
        tenantId: event.TenantId,
        name: event.EventBody.object.name,
        value: event.EventBody.object.value,
        applyTo: event.EventBody.object.applyTo,
        required: event.EventBody.object.required,
        _v: event.EventBody.object.RevisionNumber,
    };

    switch (event.EventBody.Action) {
        case 'Created':
                return restoreCreatedEvent(context, eventDefinition, event.EventBody.object.createdAt);
        case 'Updated':
                return restoreUpdatedEvent(context, eventDefinition, event.EventBody.object.updatedAt, event.EventBody.object.createdAt);
        case 'Deleted':
                return restoreDeletedEvent(context, eventDefinition, event.EventBody.object.updatedAt, event.EventBody.object.createdAt);
        default:
            throw new Error('Unknown event action: ' + event.EventBody.Action);
    }
}

module.exports = restoreEvent;