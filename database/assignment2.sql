INSERT INTO public.account
(
    account_firstname,
    account_lastname,
    account_email,
    account_password
) VALUES ('Tony','Stark', 'tony@starkent.com','Iam1ronM@n');

UPDATE public.account
    SET account_type = 'Admin'::account_type
    WHERE account_email = 'tony@starkent.com';

DELETE FROM public.account
	WHERE account_firstname = 'Tony'; 

UPDATE public.inventory
SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
WHERE inv_make = 'GM' AND inv_model = 'Hummer';

UPDATE public.inventory
SET 
    inv_image = REPLACE(inv_image, '/', '/vehicles/'),
    inv_thumbnail = REPLACE(inv_thumbnail, '/', '/vehicles/')
WHERE 
    inv_image NOT LIKE '%/vehicles/%'
    AND inv_thumbnail NOT LIKE '%/vehicles/%';

SELECT 
    inv.inv_make, 
    inv.inv_model, 
    cls.classification_name
FROM public.inventory inv
INNER JOIN public.classification cls
    ON inv.classification_id = cls.classification_id
WHERE cls.classification_name = 'Sport';


