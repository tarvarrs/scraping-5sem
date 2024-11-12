const { Model, DataTypes } = require('sequelize');
const Source = require('./Source');

module.exports = (sequelize) => {
    class Status extends Model {}

    Status.init({
        taskName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending',
        },
        message: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
        }
    }, {
        sequelize,
        modelName: 'Status',
        tableName: 'status'
    });

    Status.belongsTo(Source(sequelize), { foreignKey: 'sourceId', as: 'source', onDelete: 'CASCADE'});
    return Status;
};

