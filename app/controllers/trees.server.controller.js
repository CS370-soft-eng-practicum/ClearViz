var mongoose = require('mongoose'),
    Tree = mongoose.model('Tree');

var getErrorMessage = function(err) {
if (err.errors) {
    for (var errName in err.errors) {
        if (err.errors[errName].message)
            return err.errors[errName].message;
    }
} else {
    return 'Unknown server error';
    }
};

exports.create = function(req, res) {
    var request = require('request');
    console.log(req.body.content);
    request.post('http://52.1.147.106:4567/deptree', { form: req.body.content},
        function(error, response, body) {
            console.log(body);
            if (!error && response.statusCode == 200) {
                var tree = new Tree(req.body);
                tree.creator = req.user;
                // console.log(body);
                tree.data = body;
                console.log(tree);
                tree.save(function(err) {
                    if (err) {
                        return res.status(400).send({
                            message: getErrorMessage(err)
                        });
                    } else {
                        res.json(tree);
                    }
                });
            }
            else {
                console.log('fail');
            }
        }
    );
};

exports.list = function(req, res) {
Tree.find().sort('-created').populate('creator', 'firstName lastName fullName').exec(
    function(err, tree) {
        if (err) {
            return res.status(400).send({
                message: getErrorMessage(err)
        });
        } else {
            res.json(tree);
        }
    }); 
};

exports.treeByID = function(req, res, next, id) {
Tree.findById(id).populate('creator', 'firstName lastName fullName').exec(
    function(err, tree) {
        if (err) return next(err);
        if (!tree) return next(new Error('Failed to load tree ' + id));
        req.tree = tree;
        next();
    });
};

exports.read = function(req, res) {
    res.json(req.tree);
};

exports.update = function(req, res) {
    var tree = req.tree;
    tree.title = req.body.title;
    tree.content = req.body.content;
    tree.save(function(err) {
        if (err) {
            return res.status(400).send({
            message: getErrorMessage(err)
        });
        } else {
            res.json(tree);
        }
    });
};

exports.delete = function(req, res) {
var tree = req.tree;
tree.remove(
    function(err) {
        if (err) {
            return res.status(400).send({
                message: getErrorMessage(err)
            });
        } else {
            res.json(tree);
        }
    });
};

exports.hasAuthorization = function(req, res, next) {
    if (req.tree.creator.id !== req.user.id) {
            return res.status(403).send({
                message: 'User is not authorized'
        });
    }
    next();
};


