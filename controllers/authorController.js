var Author = require('../models/author');
var async = require('async');
var Book = require('../models/book');
const {body,validationResult} = require('express-validator');
const author = require('../models/author');
const book = require('../models/book');

//Display list of all Authors.
exports.author_list = function(req,res, next) {
  
  Author.find()
  .sort([['family_name', 'ascending']])
  .exec(function(err, list_authors) {
    if(err) {return next(err); }
    //Succesful, so render
    res.render('author_list', {title: 'Author List', author_list: list_authors});
  });
};

//Display detail page for a specific author
exports.author_detail = function(req,res, next){
  
  async.parallel({
    author: function(callback){
      Author.findById(req.params.id)
        .exec(callback)
    },
    authors_books: function(callback){
      Book.find({'author': req.params.id}, 'title summary')
        .exec(callback)
    },
   }, function (err,results){
    if(err){ return next(err); }
    if(results.author == null){// No results
      var err = new Error('Author not found');
      err.status = 404;
      return next(err);
    }
    //Successful, so render
    res.render('author_detail', {title: 'Author Detail', author: results.author, author_books: results.author_books });
   });
};

//Display author create form on GET.
exports.author_create_get = function(req,res,next) {
  res.render('author_form', {title: 'Create Author'});
}

// Handle Author create on POST.
exports.author_create_post = [

    //Validate and sanitize fields.
    body('first_name').trim().isLength({min: 1}).escape().withMessage('First name must be specified')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({min: 1}).escape().withMessage('Family name must be specified')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth','Invalid date of birth').optional({checkFalsy: true}).isISO8601().toDate,
    body('date_of_death','Invalid date of death').optional({checkFalsy: true}).isISO8601().toDate,


    //Process request after validation and sanitization.
    (req,res,next) => {

      //Extract the validation errors from request.
      const errors = validationResult(req);

      if(!errors.isEmpty()) {
        //There are errors. Render form again with sanitized values/errors messages.
        res.render('author_form', {title: 'Create Author', author: req.body, errors:errors.array()});
        return;
      }
      else {
        //Data fomr is valid.

        //Create an Author object with escaped and trimmed data.
        var Author = new Author(
          {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death
          });

        author.save(function(err){
          if(err) { return next(err); }
          //Succesful - redirect to new author record.
          res.redirect(author.url);
        });
      }
    }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res) {
  
    async.parallel({
      author: function(callback){
        Author.findById(req.params.id).exec(callback)
      },
      author_books: function(callback){
        Book.find({'author' : req.params.id}).exec(callback)
      },
    }, function(err,results){
      if (err) { return next(err); }
      if(results.author==null) { // No results.
        res.redirect('/catalog/authors');
      }
      // Succesful, so render.
      res.render('author_delete', {title: 'Delte Author', author: results.author, author_books:results.authors_books } );
    });
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res) {
  
    async.parallel({
      author: function(callback) {
        Author.findById(req.body.authorid).exec(callback)
      },
      author_books: function(callback){
        Book.find({'author' : req.body.authorid}).exec(callback)
      },
    }, function(err,results){
      if (err) { return next(err); }
      // Succes
      if (results.author_books.length > 0) {
        // Author has books. Render in same way as for get Route.
        res.render('author_delete', {title: 'Delte Author', author: results.author, author_books:results.authors_books } );
        return;
      }
      else {
        // Author has no books. Delte object and redirect to the list of authors.
        Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(er) {
          if(err) { return next (err); }
          // Succes - go to author list
          res.redirect('/catalog/authors')
        })
      }
    });
};

// Display Author update form on GET.
exports.author_update_get = function(req, res) {
  res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
exports.author_update_post = function(req, res) {
  res.send('NOT IMPLEMENTED: Author update POST');
};
