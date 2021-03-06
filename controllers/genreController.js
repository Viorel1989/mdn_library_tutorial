const genre = require('../models/genre');
var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body, validationResult } = require('express-validator');
const book = require('../models/book');

exports.genre_list = function (req,res, next) {
  genre.find()
  .sort([['name', 'ascending']])
  .exec(function(err,list_genres){
    if(err) { return next(err)}
    //Succesful so render
    res.render('genre_list', {title: 'Genre List', genres_list: list_genres});
});
};
  
// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
      genre: function(callback) {
        Genre.findById(req.params.id)
          .exec(callback);
      },
      genre_books: function(callback){
        Book.find({'genre' : req.params.id })
          .exec(callback);
      },
    }, function (err, results){
        if(err){ return next(err);}
        if(results.genre==null){ // No results
          var err = new Error('Genre not found');
          err.status = 404;
          return next(err);
        }
        //Succesful, so render
        res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books} );
    });
};

// Display Genre create form on GET.
exports.genre_create_get = [

    //Validate and santize the name field
    body('name','Genre name required').trim().isLength({min: 1 }).escape(),

    //Process request after validation and sanitization
    (req,res,next) => {

      //Extract the validation errors from a request
      const errors = validationResult(req);

      //Create genre object with escaped and trimmed data
      var genre = new Genre(
        { name: req.body.name}
      );

      if (!errors.isEmpty()){
        //There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', { title: 'Create Genre', genre: genre});
        return;
      }
      else {
        //Data form is valid.
        //Check if Genre with same name already exists.
        Genre.findOne({'name': req.body.name})
          .exec(function(err, found_genre){
            if(err) { return next(err); }

            if(found_genre){
              //Genre exists, redirect to its detail page.
              res.redirect(found_genre.url);
            }
            else {
              genre.save(function (err) {
                if (err) { return next(err); }
                //Genre saved. Redirect to genre detail page.
                res.redirect(genre.url);
              });
            }
          });
      }
    }

];

// Handle Genre create on POST.
exports.genre_create_post = function(req, res, next) {
   
    //Validate and sanitize the name field.
    body('name', 'Genre name is required').trim().isLength({min: 1}).escape(),

    // Process request after validation and sanitization
    (req,res,next) => {
    
        // Extract the validation erros from request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.

        var genre = new Genre(
          { name: req.body.name }
        );

        if(!error.isEmpty()){
          // There are errors. Render the form again with sanitized valus/error messages.
          res.render('genre_form', { title: 'Create genre', genre: genre, errors: errors.array()});
          return;
        }
        else {
          // Data form is valid
          // Check if Genre with same name already exists.
          Genre.findOne({ 'name': req.body.name })
          .exec(function(err, found_genre){
            if (err) { return next(err); }

            if(found_genre) {
              // Genre exists, redirect to it's detail page.
              res.redirect(found_genre.url);
            }
            else {

              genre.save(function (err){
                if (err) {return next(err);}
                // Genre saved. Redirect to genre detail page.
                res.redirect(genre.url);
              });
            }
          });
        }
    }
};

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    

    async.parallel({
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function (callback){
        Book.find({'genre': req.params.id}).exec(callback);
      },
    }, function (err, results) {
      if (err) { return next(err); }
      if (results.genre==null) { //no results
        res.redirect('catalog/genres');
      }
      // Succesful, so render
      res.render('genre_delete', {title: 'Delete genre', genre: results.genre, genre_books: results.genre_books});
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    
  async.parallel({
    genre: function (callback){
      Genre.findById(req.params.id).exec(callback);
    },
    genre_books: function (callback) {
      Book.find({'genre' : req.params.id}).exec(callback);
    }, 
  }, function (err,results) {
    if(err) { return next(err); }
    if(results.genre_books.length > 0) {
      // genre has books so render in the same way for get routes
      res.render('genre_delete', { title: 'Delete genre', genre: results.genre, genre_books: results.genre_books} );
      return;
    } else {
      // Genre has no books. Delte object and return to list of genres
      Genre.findByIdAndRemove(req.body.id, function deleteGenre(err) {
        if (err) { return next(err); }
        // Succes - go to genres list.
        res.redirect('/catalog/genres');
      });
    }
  }
)};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res,next) {
    Genre.findById(req.params.id, function(err,genre){
      // First handle errors
      if (err) { return next (err); }
      if (genre == null) {
        var err = new Error('Object not found');
        err.status = 404;
        return next (err);
      }
      // No errors so display update form
      res.render('genre_form', {title: 'Update Genre', genre:genre});
    })
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitize the name field
  body('name', 'Genre name must contain at least 3 characters').trim().isLength({min: 3}).escape(),

  // Process the request after validation and sanitization.
  (req,res,next) => {

    // Extract the validation errors from request
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data
    var genre = new Genre ({
      name: req.params.name,
      _id: req.params.id
    });

    if (!errors.isEmpty()){
      // There are errors. Render the form again with sanitized values and error message
      res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors.array()});
      return;
    } else {
      // Data form is valid so update the record.
      Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,thegenre){
        if (err) { return next(err); }
        // Succes - redirect to updated record
        res.redirect(thegenre.url);
      })
    }
  }];
