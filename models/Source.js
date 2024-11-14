const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Source extends Model {}
    
    Source.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Source',
        tableName: 'sources'
    });
    return Source;
};
