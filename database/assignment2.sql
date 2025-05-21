INSERT INTO public.account
(
    account_firstname,
    account_lastname,
    account_email,
    account_password
) VALUES ('Tony','Stark', 'tony@starkent.com','Iam1ronM@n');

UPDATE public.account
    SET account_type = 'Admin'::account_type  -- Why do you say this will not run?
    WHERE account_firstname = 'Tony';

DELETE FROM public.account
	WHERE account_firstname = 'Tony'; 

UPDATE public.inventory
    SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
    WHERE inv_make = 'GM' AND inv_model = 'Hummer';


SELECT 
    inv.inv_make, 
    inv.inv_model, 
    cls.classification_name
    FROM public.inventory inv
    INNER JOIN public.classification cls
        ON inv.classification_id = cls.classification_id
    WHERE cls.classification_name = 'Sport';

UPDATE public.inventory
    SET 
        inv_image = REPLACE(inv_image, '/images/', '/images/vehicles/'),
        inv_thumbnail = REPLACE(inv_thumbnail, '/images/', '/images/vehicles/')
    WHERE 
        inv_image NOT LIKE '%/images/vehicles/%'
        OR inv_thumbnail NOT LIKE '%/images/vehicles/%';



